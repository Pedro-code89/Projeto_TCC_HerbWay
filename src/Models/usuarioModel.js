const { pool } = require('../Config/database');
const localidadeService = require('../Services/localidadeService');
const { coordenadaPublica } = require('../Services/geocodingService');

function colunaAusente(erro) {
  return erro && (erro.code === 'ER_BAD_FIELD_ERROR' || /Unknown column/i.test(String(erro.message || '')));
}

function publicoUsuario(row) {
  if (!row) return null;
  return { ...row, latitude: coordenadaPublica(row.latitude), longitude: coordenadaPublica(row.longitude) };
}

async function listar() {
  let rows;
  try {
    [rows] = await pool.query(`
      SELECT u.id_usuario AS id, u.nome, u.email, u.telefone, u.cidade, u.estado, u.bairro, u.sobre, u.foto, u.email_verificado,
             u.latitude, u.longitude,
             COALESCE(ROUND(AVG(a.nota), 1), 0) AS avaliacao,
             COUNT(a.id_avaliacao) AS avaliacoes
      FROM usuarios u
      LEFT JOIN avaliacoes a ON a.id_profissional = u.id_usuario
      GROUP BY u.id_usuario
      ORDER BY u.nome
    `);
  } catch (erro) {
    if (!colunaAusente(erro)) throw erro;
    [rows] = await pool.query(`
      SELECT u.id_usuario AS id, u.nome, u.email, u.telefone, u.cidade, u.estado, u.bairro, u.sobre, u.foto, u.email_verificado,
             COALESCE(ROUND(AVG(a.nota), 1), 0) AS avaliacao,
             COUNT(a.id_avaliacao) AS avaliacoes
      FROM usuarios u
      LEFT JOIN avaliacoes a ON a.id_profissional = u.id_usuario
      GROUP BY u.id_usuario
      ORDER BY u.nome
    `);
  }
  return rows.map(publicoUsuario);
}

async function buscarPorId(id) {
  let rows;
  try {
    [rows] = await pool.query(`
      SELECT u.id_usuario AS id, u.nome, u.email, u.telefone, u.cidade, u.estado, u.bairro, u.sobre, u.foto, u.email_verificado,
             u.latitude, u.longitude,
             COALESCE(ROUND(AVG(a.nota), 1), 0) AS avaliacao,
             COUNT(a.id_avaliacao) AS avaliacoes
      FROM usuarios u
      LEFT JOIN avaliacoes a ON a.id_profissional = u.id_usuario
      WHERE u.id_usuario = ?
      GROUP BY u.id_usuario
    `, [id]);
  } catch (erro) {
    if (!colunaAusente(erro)) throw erro;
    [rows] = await pool.query(`
      SELECT u.id_usuario AS id, u.nome, u.email, u.telefone, u.cidade, u.estado, u.bairro, u.sobre, u.foto, u.email_verificado,
             COALESCE(ROUND(AVG(a.nota), 1), 0) AS avaliacao,
             COUNT(a.id_avaliacao) AS avaliacoes
      FROM usuarios u
      LEFT JOIN avaliacoes a ON a.id_profissional = u.id_usuario
      WHERE u.id_usuario = ?
      GROUP BY u.id_usuario
    `, [id]);
  }
  return publicoUsuario(rows[0]);
}

async function buscarPorIdInterno(id) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
  return rows[0] || null;
}

async function buscarPorEmail(email) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0] || null;
}

async function criar({ nome, email, senha }) {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(senha, 10);
  const [result] = await pool.query(
    'INSERT INTO usuarios (nome, email, senha, email_verificado) VALUES (?, ?, ?, 0)',
    [nome, email, hash]
  );
  return buscarPorId(result.insertId);
}

async function atualizarSenha(id, senha) {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(senha, 10);
  await pool.query('UPDATE usuarios SET senha = ? WHERE id_usuario = ?', [hash, id]);
}

async function atualizar(id, campos) {
  const cidade = campos.cidade ? String(campos.cidade).trim() : null;
  const estado = campos.estado ? String(campos.estado).trim().toUpperCase() : null;
  const bairro = campos.bairro ? String(campos.bairro).trim() : null;
  const temCoords = Object.prototype.hasOwnProperty.call(campos, 'latitude') || Object.prototype.hasOwnProperty.call(campos, 'longitude');
  const latitude = temCoords ? (campos.latitude ?? null) : undefined;
  const longitude = temCoords ? (campos.longitude ?? null) : undefined;

  const erroValidacao = (mensagem) => {
    const e = new Error(mensagem);
    e.statusCode = 400;
    return e;
  };

  if ((cidade && !estado) || (estado && !cidade)) {
    throw erroValidacao('Informe tanto a cidade quanto o estado.');
  }
  if (cidade && estado && !localidadeService.validarLocalidade(estado, cidade)) {
    throw erroValidacao('Cidade inválida para o estado selecionado.');
  }

  if (temCoords) {
    try {
      await pool.query(
        `UPDATE usuarios
         SET nome = ?, email = ?, telefone = ?, cidade = ?, estado = ?, bairro = ?, sobre = ?, foto = ?, latitude = ?, longitude = ?
         WHERE id_usuario = ?`,
        [campos.nome, campos.email, campos.telefone || null, cidade || null, estado || null, bairro || null, campos.sobre || null, campos.foto || null, latitude, longitude, id]
      );
    } catch (erro) {
      if (!colunaAusente(erro)) throw erro;
      await pool.query(
        `UPDATE usuarios SET nome = ?, email = ?, telefone = ?, cidade = ?, estado = ?, bairro = ?, sobre = ?, foto = ? WHERE id_usuario = ?`,
        [campos.nome, campos.email, campos.telefone || null, cidade || null, estado || null, bairro || null, campos.sobre || null, campos.foto || null, id]
      );
    }
  } else {
    await pool.query(
      `UPDATE usuarios SET nome = ?, email = ?, telefone = ?, cidade = ?, estado = ?, bairro = ?, sobre = ?, foto = ? WHERE id_usuario = ?`,
      [campos.nome, campos.email, campos.telefone || null, cidade || null, estado || null, bairro || null, campos.sobre || null, campos.foto || null, id]
    );
  }
  return buscarPorId(id);
}

module.exports = { listar, buscarPorId, buscarPorIdInterno, buscarPorEmail, criar, atualizar, atualizarSenha };
