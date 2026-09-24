const { pool } = require('../Config/database');

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
  return rows[0] || null;
}

async function categoriaId(nome) {
  const nomeBanco = nome === 'Manutenção' ? 'Manutenção de Jardim' : nome;
  const [rows] = await pool.query('SELECT id_categoria FROM categorias WHERE nome = ?', [nomeBanco]);
  return rows[0]?.id_categoria || null;
}

async function criar(usuarioId, dados) {
  const idCategoria = await categoriaId(dados.categoria);
  if (!idCategoria) throw new Error('Categoria não encontrada.');
  const [result] = await pool.query(`
    INSERT INTO anuncios (id_usuario, id_categoria, titulo, descricao, preco, cidade, estado, ativo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [usuarioId, idCategoria, dados.titulo, dados.descricao, dados.preco, dados.cidade, dados.estado, dados.ativo]);
  return buscarPorId(result.insertId);
}

async function atualizar(id, usuarioId, dados) {
  const idCategoria = await categoriaId(dados.categoria);
  if (!idCategoria) throw new Error('Categoria não encontrada.');
  const [result] = await pool.query(`
    UPDATE anuncios
    SET id_categoria = ?, titulo = ?, descricao = ?, preco = ?, cidade = ?, estado = ?, ativo = ?
    WHERE id_anuncio = ? AND id_usuario = ?
  `, [idCategoria, dados.titulo, dados.descricao, dados.preco, dados.cidade, dados.estado, dados.ativo, id, usuarioId]);
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

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
