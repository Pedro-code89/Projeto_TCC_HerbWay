const { pool } = require('../Config/database');
const localidadeService = require('../Services/localidadeService');

function validarLocalidade(cidade, estado) {
  const erroValidacao = (mensagem) => {
    const e = new Error(mensagem);
    e.statusCode = 400;
    return e;
  };
  if (!cidade || !estado) throw erroValidacao('Cidade e estado são obrigatórios.');
  const cidadeTrim = String(cidade).trim();
  const estadoTrim = String(estado).trim().toUpperCase();
  if (!cidadeTrim || !estadoTrim) throw erroValidacao('Cidade e estado são obrigatórios.');
  if (!localidadeService.validarLocalidade(estadoTrim, cidadeTrim)) {
    throw erroValidacao('Cidade inválida para o estado selecionado.');
  }
  return { cidade: cidadeTrim, estado: estadoTrim };
}

async function listar() {
  const [rows] = await pool.query(`
    SELECT an.id_anuncio AS id,
           an.id_usuario AS usuarioId,
           an.id_categoria AS categoriaId,
           an.titulo AS titulo,
           an.descricao,
           an.preco,
           an.cidade,
           an.estado,
           an.ativo,
           c.nome AS categoria,
           u.nome AS nome,
           u.telefone,
           u.bairro,
           u.sobre,
           COALESCE(ROUND(AVG(av.nota), 1), 0) AS avaliacao,
           COUNT(av.id_avaliacao) AS avaliacoes
    FROM anuncios an
    INNER JOIN usuarios u ON u.id_usuario = an.id_usuario
    INNER JOIN categorias c ON c.id_categoria = an.id_categoria
    LEFT JOIN avaliacoes av ON av.id_anuncio = an.id_anuncio
    GROUP BY an.id_anuncio
    ORDER BY an.id_anuncio DESC
  `);
  return mascarar(rows);
}

function mascarar(rows) {
  rows.forEach(r => {
    const d = (r.telefone || '').replace(/\D/g, '');
    r.telefone = d.length >= 4 ? `(${d.slice(0, 2)}) 9****-****` : null;
  });
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await pool.query(`
    SELECT an.id_anuncio AS id,
           an.id_usuario AS usuarioId,
           an.id_categoria AS categoriaId,
           an.titulo, an.descricao, an.preco, an.cidade, an.estado, an.ativo,
           c.nome AS categoria,
           u.nome AS nome, u.telefone, u.bairro, u.sobre,
           COALESCE(ROUND(AVG(av.nota), 1), 0) AS avaliacao,
           COUNT(av.id_avaliacao) AS avaliacoes
    FROM anuncios an
    INNER JOIN usuarios u ON u.id_usuario = an.id_usuario
    INNER JOIN categorias c ON c.id_categoria = an.id_categoria
    LEFT JOIN avaliacoes av ON av.id_anuncio = an.id_anuncio
    WHERE an.id_anuncio = ?
    GROUP BY an.id_anuncio
  `, [id]);
  return rows[0] ? mascarar(rows)[0] : null;
}

async function buscarTelefone(id) {
  const [rows] = await pool.query(`
    SELECT u.telefone FROM anuncios an INNER JOIN usuarios u ON u.id_usuario = an.id_usuario
    WHERE an.id_anuncio = ?
  `, [id]);
  return rows[0]?.telefone || null;
}

async function buscarFotos(id) {
  try {
    const [rows] = await pool.query(
      'SELECT fotos FROM anuncios WHERE id_anuncio = ?',
      [id]
    );
    if (!rows || rows.length === 0) return [];
    const valor = rows[0].fotos;
    if (!valor) return [];

    // Tenta interpretar como JSON (array de objetos ou strings)
    try {
      const parseado = JSON.parse(valor);
      if (Array.isArray(parseado)) {
        return parseado.map(f => {
          if (typeof f === 'string') return { url: f, legenda: '' };
          if (f && typeof f === 'object') return { url: f.url || f.caminho || '', legenda: f.legenda || f.descricao || '' };
          return { url: '', legenda: '' };
        }).filter(f => f.url);
      }
      if (parseado && typeof parseado === 'object' && parseado.url) return [parseado];
    } catch {
      // Não é JSON, trata como texto separado por vírgula ou uma única URL
      const urls = String(valor).split(',').map(u => u.trim()).filter(u => u);
      return urls.map(url => ({ url, legenda: '' }));
    }

    return [];
  } catch (erro) {
    // Coluna fotos ainda não existe no banco; retorna vazio até a estrutura estar disponível.
    return [];
  }
}

async function categoriaId(nome) {
  const nomeBanco = nome === 'Manutenção' ? 'Manutenção de Jardim' : nome;
  const [rows] = await pool.query('SELECT id_categoria FROM categorias WHERE nome = ?', [nomeBanco]);
  return rows[0]?.id_categoria || null;
}

async function criar(usuarioId, dados) {
  const idCategoria = await categoriaId(dados.categoria);
  if (!idCategoria) throw new Error('Categoria não encontrada.');
  const local = validarLocalidade(dados.cidade, dados.estado);
  const [result] = await pool.query(`
    INSERT INTO anuncios (id_usuario, id_categoria, titulo, descricao, preco, cidade, estado, ativo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [usuarioId, idCategoria, dados.titulo, dados.descricao, dados.preco, local.cidade, local.estado, dados.ativo]);
  return buscarPorId(result.insertId);
}

async function atualizar(id, usuarioId, dados) {
  const idCategoria = await categoriaId(dados.categoria);
  if (!idCategoria) throw new Error('Categoria não encontrada.');
  const local = validarLocalidade(dados.cidade, dados.estado);
  const [result] = await pool.query(`
    UPDATE anuncios
    SET id_categoria = ?, titulo = ?, descricao = ?, preco = ?, cidade = ?, estado = ?, ativo = ?
    WHERE id_anuncio = ? AND id_usuario = ?
  `, [idCategoria, dados.titulo, dados.descricao, dados.preco, local.cidade, local.estado, dados.ativo, id, usuarioId]);
  if (!result.affectedRows) throw new Error('Este serviço não está disponível para edição.');
  return buscarPorId(id);
}

async function excluir(id, usuarioId) {
  const [result] = await pool.query(
    'DELETE FROM anuncios WHERE id_anuncio = ? AND id_usuario = ?',
    [id, usuarioId]
  );
  if (!result.affectedRows) throw new Error('Este serviço não está disponível para exclusão.');
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir, buscarTelefone, buscarFotos };
