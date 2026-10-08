const router = require('express').Router();
const { pool } = require('../Config/database');

router.get('/api/dados', async (req, res) => {
  const [usuarios] = await pool.query(`
    SELECT u.id_usuario AS id, u.nome, u.email, u.telefone, u.cidade, u.estado, u.bairro, u.sobre, u.foto,
           COALESCE(ROUND(AVG(a.nota), 1), 0) AS avaliacao,
           COUNT(a.id_avaliacao) AS avaliacoes
    FROM usuarios u LEFT JOIN avaliacoes a ON a.id_profissional = u.id_usuario
    GROUP BY u.id_usuario
  `);
  const [servicos] = await pool.query(`
    SELECT 
        an.id_anuncio AS id,
        an.id_usuario AS usuarioId,
        an.id_categoria AS categoriaId,
        an.titulo,
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
        u.foto,
        COALESCE(ROUND(AVG(av.nota), 1), 0) AS avaliacao,
        COUNT(av.id_avaliacao) AS avaliacoes
    FROM anuncios an
    INNER JOIN categorias c 
        ON c.id_categoria = an.id_categoria
    INNER JOIN usuarios u 
        ON u.id_usuario = an.id_usuario
    LEFT JOIN avaliacoes av 
        ON av.id_anuncio = an.id_anuncio
    GROUP BY 
        an.id_anuncio,
        an.id_usuario,
        an.id_categoria,
        an.titulo,
        an.descricao,
        an.preco,
        an.cidade,
        an.estado,
        an.ativo,
        c.nome,
        u.nome,
        u.telefone,
        u.bairro,
        u.sobre,
        u.foto
    ORDER BY an.id_anuncio DESC
`);
  let contratacoes = [];
  const mascararTelefone = telefone => {
    if (!telefone) return null;
    const digitos = telefone.replace(/\D/g, '');
    if (digitos.length < 4) return null;
    return `(${digitos.slice(0, 2)}) 9****-****`;
  };
  usuarios.forEach(u => { u.telefone = mascararTelefone(u.telefone); });
  servicos.forEach(s => { s.telefone = mascararTelefone(s.telefone); });
  if (req.session.usuarioId) {
    const [rows] = await pool.query(`
      SELECT c.id_contratacao AS id, c.id_cliente AS usuarioId, c.id_anuncio AS servicoId,
             c.data_servico AS data, c.status, a.titulo, a.descricao, u.nome AS profissional,
             av.nota, av.comentario
      FROM contratacoes c
      INNER JOIN anuncios a ON a.id_anuncio = c.id_anuncio
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      LEFT JOIN avaliacoes av ON av.id_contratacao = c.id_contratacao
      WHERE c.id_cliente = ? ORDER BY c.data_servico DESC
    `, [req.session.usuarioId]);
    contratacoes = rows.map(item => ({ ...item, data: item.data.toISOString().slice(0, 10) }));
  }
  const [avaliacoes] = await pool.query(`
    SELECT av.id_anuncio AS servicoId, av.nota, av.comentario, u.nome AS cliente
    FROM avaliacoes av
    INNER JOIN usuarios u ON u.id_usuario = av.id_cliente
    ORDER BY av.id_avaliacao DESC
  `);
  res.json({ usuarios, servicos, contratacoes, avaliacoes });
});

module.exports = router;
