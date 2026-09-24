const { pool } = require('../Config/database');

async function listar() {
  const [rows] = await pool.query(`
    SELECT u.id_usuario AS id, u.nome, u.email, u.telefone, u.cidade, u.estado, u.bairro, u.sobre,
           COALESCE(ROUND(AVG(a.nota), 1), 0) AS avaliacao,
           COUNT(a.id_avaliacao) AS avaliacoes
    FROM usuarios u
    LEFT JOIN avaliacoes a ON a.id_profissional = u.id_usuario
    GROUP BY u.id_usuario
    ORDER BY u.nome
  `);
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await pool.query(`
    SELECT u.id_usuario AS id, u.nome, u.email, u.telefone, u.cidade, u.estado, u.bairro, u.sobre,
           COALESCE(ROUND(AVG(a.nota), 1), 0) AS avaliacao,
           COUNT(a.id_avaliacao) AS avaliacoes
    FROM usuarios u
    LEFT JOIN avaliacoes a ON a.id_profissional = u.id_usuario
    WHERE u.id_usuario = ?
    GROUP BY u.id_usuario
  `, [id]);
  return rows[0] || null;
}

async function buscarPorEmail(email) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0] || null;
}

async function criar({ nome, email, senha }) {
  const [result] = await pool.query(
    'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
    [nome, email, senha]
  );
  return buscarPorId(result.insertId);
}

async function atualizar(id, campos) {
  const sql = `
    UPDATE usuarios
    SET nome = ?, email = ?, telefone = ?, cidade = ?, estado = ?, bairro = ?, sobre = ?
    WHERE id_usuario = ?
  `;
  await pool.query(sql, [
    campos.nome, campos.email, campos.telefone || null, campos.cidade || null,
    campos.estado || null, campos.bairro || null, campos.sobre || null, id
  ]);
  return buscarPorId(id);
}

module.exports = { listar, buscarPorId, buscarPorEmail, criar, atualizar };
