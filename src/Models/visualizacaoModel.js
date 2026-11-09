const { pool } = require('../Config/database');

const DEDUP_MINUTOS = 30;

function tabelaAusente(erro) {
  return erro && (erro.code === 'ER_NO_SUCH_TABLE' || /doesn\'t exist/i.test(String(erro.message || '')));
}

function periodoFiltro(periodo) {
  if (periodo === '7d') return 'v.visto_em >= (NOW() - INTERVAL 7 DAY)';
  if (periodo === '30d') return 'v.visto_em >= (NOW() - INTERVAL 30 DAY)';
  return '1=1'; // total
}

async function registrarPerfil({ alvoId, visualizadorId, sessaoId }) {
  if (!alvoId) return;
  if (visualizadorId && String(visualizadorId) === String(alvoId)) return; // proprietário
  try {
    if (visualizadorId) {
      const [rows] = await pool.query(
        `SELECT id_visualizacao FROM visualizacoes
         WHERE tipo='perfil' AND id_usuario_alvo=? AND id_visualizador=? AND visto_em >= (NOW() - INTERVAL ? MINUTE)
         LIMIT 1`,
        [alvoId, visualizadorId, DEDUP_MINUTOS]
      );
      if (rows.length) {
        await pool.query('UPDATE visualizacoes SET visto_em = NOW() WHERE id_visualizacao = ?', [rows[0].id_visualizacao]);
      } else {
        await pool.query(
          `INSERT INTO visualizacoes (tipo, id_usuario_alvo, id_servico_alvo, id_visualizador, sessao_id, visto_em)
           VALUES ('perfil', ?, NULL, ?, NULL, NOW())`,
          [alvoId, visualizadorId]
        );
      }
    } else if (sessaoId) {
      const [rows] = await pool.query(
        `SELECT id_visualizacao FROM visualizacoes
         WHERE tipo='perfil' AND id_usuario_alvo=? AND id_visualizador IS NULL AND sessao_id=? AND visto_em >= (NOW() - INTERVAL ? MINUTE)
         LIMIT 1`,
        [alvoId, sessaoId, DEDUP_MINUTOS]
      );
      if (rows.length) {
        await pool.query('UPDATE visualizacoes SET visto_em = NOW() WHERE id_visualizacao = ?', [rows[0].id_visualizacao]);
      } else {
        await pool.query(
          `INSERT INTO visualizacoes (tipo, id_usuario_alvo, id_servico_alvo, id_visualizador, sessao_id, visto_em)
           VALUES ('perfil', ?, NULL, NULL, ?, NOW())`,
          [alvoId, sessaoId]
        );
      }
    }
  } catch (erro) {
    if (tabelaAusente(erro)) console.warn('[visualizacoes] tabela ausente: execute database-migration-visualizacoes.sql');
    else console.error('[visualizacoes] perfil:', erro.message);
  }
}

async function registrarServico({ servicoId, alvoId, visualizadorId, sessaoId }) {
  if (!servicoId || !alvoId) return;
  if (visualizadorId && String(visualizadorId) === String(alvoId)) return; // proprietário
  try {
    if (visualizadorId) {
      const [rows] = await pool.query(
        `SELECT id_visualizacao FROM visualizacoes
         WHERE tipo='servico' AND id_servico_alvo=? AND id_visualizador=? AND visto_em >= (NOW() - INTERVAL ? MINUTE)
         LIMIT 1`,
        [servicoId, visualizadorId, DEDUP_MINUTOS]
      );
      if (rows.length) {
        await pool.query('UPDATE visualizacoes SET visto_em = NOW() WHERE id_visualizacao = ?', [rows[0].id_visualizacao]);
      } else {
        await pool.query(
          `INSERT INTO visualizacoes (tipo, id_usuario_alvo, id_servico_alvo, id_visualizador, sessao_id, visto_em)
           VALUES ('servico', ?, ?, ?, NULL, NOW())`,
          [alvoId, servicoId, visualizadorId]
        );
      }
    } else if (sessaoId) {
      const [rows] = await pool.query(
        `SELECT id_visualizacao FROM visualizacoes
         WHERE tipo='servico' AND id_servico_alvo=? AND id_visualizador IS NULL AND sessao_id=? AND visto_em >= (NOW() - INTERVAL ? MINUTE)
         LIMIT 1`,
        [servicoId, sessaoId, DEDUP_MINUTOS]
      );
      if (rows.length) {
        await pool.query('UPDATE visualizacoes SET visto_em = NOW() WHERE id_visualizacao = ?', [rows[0].id_visualizacao]);
      } else {
        await pool.query(
          `INSERT INTO visualizacoes (tipo, id_usuario_alvo, id_servico_alvo, id_visualizador, sessao_id, visto_em)
           VALUES ('servico', ?, ?, NULL, ?, NOW())`,
          [alvoId, servicoId, sessaoId]
        );
      }
    }
  } catch (erro) {
    if (tabelaAusente(erro)) console.warn('[visualizacoes] tabela ausente: execute database-migration-visualizacoes.sql');
    else console.error('[visualizacoes] servico:', erro.message);
  }
}

async function estatisticas(alvoWhere, params, periodo) {
  const filtro = periodoFiltro(periodo);
  try {
    const [[totais]] = await pool.query(
      `SELECT COUNT(*) AS total,
              COUNT(DISTINCT CASE WHEN v.id_visualizador IS NOT NULL THEN v.id_visualizador ELSE CONCAT('s:', v.sessao_id) END) AS pessoas
       FROM visualizacoes v
       WHERE ${alvoWhere} AND ${filtro}`,
      params
    );
    const [visitantes] = await pool.query(
      `SELECT u.id_usuario AS id, u.nome, u.foto, MAX(v.visto_em) AS ultimaVisualizacao
       FROM visualizacoes v
       INNER JOIN usuarios u ON u.id_usuario = v.id_visualizador
       WHERE ${alvoWhere} AND v.id_visualizador IS NOT NULL AND ${filtro}
       GROUP BY u.id_usuario, u.nome, u.foto
       ORDER BY ultimaVisualizacao DESC
       LIMIT 100`,
      params
    );
    const [[anon]] = await pool.query(
      `SELECT COUNT(DISTINCT v.sessao_id) AS anonimos
       FROM visualizacoes v
       WHERE ${alvoWhere} AND v.id_visualizador IS NULL AND v.sessao_id IS NOT NULL AND ${filtro}`,
      params
    );
    return {
      periodo,
      total: Number(totais?.total || 0),
      pessoas: Number(totais?.pessoas || 0),
      anonimos: Number(anon?.anonimos || 0),
      visitantes: visitantes.map(v => ({
        id: v.id,
        nome: v.nome,
        foto: v.foto || null,
        ultimaVisualizacao: v.ultimaVisualizacao
      }))
    };
  } catch (erro) {
    if (tabelaAusente(erro)) return { periodo, total: 0, pessoas: 0, anonimos: 0, visitantes: [], indisponivel: true };
    throw erro;
  }
}

async function obterEstatisticasPerfil({ alvoId, solicitanteId, periodo = 'total' }) {
  if (!solicitanteId || String(solicitanteId) !== String(alvoId)) {
    const e = new Error('Acesso negado.');
    e.statusCode = 403;
    throw e;
  }
  return estatisticas("v.tipo='perfil' AND v.id_usuario_alvo = ?", [alvoId], periodo);
}

async function obterEstatisticasServico({ servicoId, solicitanteId, periodo = 'total' }) {
  // Confirma propriedade
  const [rows] = await pool.query('SELECT id_usuario FROM anuncios WHERE id_anuncio = ?', [servicoId]);
  if (!rows.length) { const e = new Error('Serviço não encontrado.'); e.statusCode = 404; throw e; }
  if (!solicitanteId || String(solicitanteId) !== String(rows[0].id_usuario)) {
    const e = new Error('Acesso negado.');
    e.statusCode = 403;
    throw e;
  }
  return estatisticas("v.tipo='servico' AND v.id_servico_alvo = ?", [servicoId], periodo);
}

async function obterResumoPerfil({ alvoId, solicitanteId, periodo = 'total' }) {
  // retorna 7d/30d/total de uma vez? ou por periodo - vamos retornar o solicitado; estrutura permite periodos
  return obterEstatisticasPerfil({ alvoId, solicitanteId, periodo });
}
async function obterResumoServico({ servicoId, solicitanteId, periodo = 'total' }) {
  return obterEstatisticasServico({ servicoId, solicitanteId, periodo });
}

module.exports = {
  registrarPerfil,
  registrarServico,
  obterEstatisticasPerfil,
  obterEstatisticasServico,
  obterResumoPerfil,
  obterResumoServico
};
