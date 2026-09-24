const router = require('express').Router();
const { pool } = require('../Config/database');

function exigirLogin(req, res, next) {
  if (!req.session.usuarioId) return res.status(401).json({ erro: 'Faça login para continuar.' });
  next();
}

router.get('/api/contratacoes', exigirLogin, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.id_contratacao AS id, c.id_cliente AS usuarioId, c.id_anuncio AS servicoId,
           c.data_servico AS data, c.status,
           a.titulo, a.descricao, u.nome AS profissional,
           av.nota, av.comentario
    FROM contratacoes c
    INNER JOIN anuncios a ON a.id_anuncio = c.id_anuncio
    INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
    LEFT JOIN avaliacoes av ON av.id_contratacao = c.id_contratacao
    WHERE c.id_cliente = ?
    ORDER BY c.data_servico DESC
  `, [req.session.usuarioId]);
  res.json(rows.map(item => ({ ...item, data: item.data.toISOString().slice(0, 10) })));
});

router.post('/api/contratacoes', exigirLogin, async (req, res) => {
  const idAnuncio = Number(req.body.servicoId);
  const data = req.body.data;
  const [servRows] = await pool.query('SELECT * FROM anuncios WHERE id_anuncio = ? AND ativo = TRUE', [idAnuncio]);
  const servico = servRows[0];
  if (!servico) return res.status(404).json({ erro: 'Este anúncio não está mais disponível.' });
  if (servico.id_usuario === req.session.usuarioId) return res.status(400).json({ erro: 'Você não pode contratar seu próprio serviço.' });
  const [duplicado] = await pool.query(
    'SELECT id_contratacao FROM contratacoes WHERE id_cliente = ? AND id_anuncio = ? AND data_servico = ?',
    [req.session.usuarioId, idAnuncio, data]
  );
  if (duplicado.length) return res.status(409).json({ erro: 'Esse serviço já está no seu histórico nesta data.' });
  const [result] = await pool.query(
    `INSERT INTO contratacoes (id_cliente, id_anuncio, data_servico, status) VALUES (?, ?, ?, 'Contratado')`,
    [req.session.usuarioId, idAnuncio, data]
  );
  res.status(201).json({ id: result.insertId });
});

router.put('/api/contratacoes/:id/concluir', exigirLogin, async (req, res) => {
  const [result] = await pool.query(
    `UPDATE contratacoes SET status = 'Concluído' WHERE id_contratacao = ? AND id_cliente = ?`,
    [req.params.id, req.session.usuarioId]
  );
  if (!result.affectedRows) return res.status(404).json({ erro: 'Contratação não encontrada.' });
  res.json({ ok: true });
});

// Avaliação do anúncio/serviço (1 a 5 estrelas) feita pelo cliente após a conclusão.
router.post('/api/contratacoes/:id/avaliar', exigirLogin, async (req, res) => {
  const nota = Number(req.body.nota);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return res.status(400).json({ erro: 'Escolha de 1 a 5 estrelas.' });
  }
  const comentario = typeof req.body.comentario === 'string' ? req.body.comentario.trim() : '';
  if (comentario.length > 500) {
    return res.status(400).json({ erro: 'O comentário pode ter no máximo 500 caracteres.' });
  }
  const [rows] = await pool.query(`
    SELECT c.status, a.id_usuario AS profissional, c.id_anuncio
    FROM contratacoes c
    INNER JOIN anuncios a ON a.id_anuncio = c.id_anuncio
    WHERE c.id_contratacao = ? AND c.id_cliente = ?
  `, [req.params.id, req.session.usuarioId]);
  const contratacao = rows[0];
  if (!contratacao) return res.status(404).json({ erro: 'Contratação não encontrada.' });
  if (contratacao.status !== 'Concluído') return res.status(400).json({ erro: 'Conclua a contratação antes de avaliar.' });
  await pool.query(`
    INSERT INTO avaliacoes (id_cliente, id_profissional, id_anuncio, id_contratacao, nota, comentario)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE nota = VALUES(nota), comentario = VALUES(comentario)
  `, [req.session.usuarioId, contratacao.profissional, contratacao.id_anuncio, req.params.id, nota, comentario || null]);
  res.json({ ok: true, nota });
});

module.exports = router;
