const crypto = require('crypto');
const { pool } = require('../Config/database');

function hash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function criar({ idUsuario, tipo, validadeHoras }) {
  const token = crypto.randomBytes(32).toString('hex');
  await pool.query(
    'INSERT INTO tokens (id_usuario, tipo, token_hash, expira_em) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))',
    [idUsuario, tipo, hash(token), validadeHoras]
  );
  return token;
}

async function validar(token, tipo) {
  const [rows] = await pool.query(
    'SELECT * FROM tokens WHERE token_hash = ? AND tipo = ? AND usado = 0 AND expira_em > NOW()',
    [hash(token), tipo]
  );
  return rows[0] || null;
}

async function marcarUsado(idToken) {
  await pool.query('UPDATE tokens SET usado = 1 WHERE id_token = ?', [idToken]);
}

module.exports = { criar, validar, marcarUsado };
