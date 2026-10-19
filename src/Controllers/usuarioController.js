const usuarioModel = require('../Models/usuarioModel');
const bcrypt = require('bcryptjs');

const tentativas = new Map();
function limitado(chave, max = 3, janelaMs = 10 * 60 * 1000) {
  const agora = Date.now();
  const lista = (tentativas.get(chave) || []).filter(t => agora - t < janelaMs);
  lista.push(agora);
  tentativas.set(chave, lista);
  return lista.length > max;
}

function login(req, res) { res.render('Pages/login', { pagina: 'login' }); }
function cadastro(req, res) { res.render('Pages/cadastro', { pagina: 'cadastro' }); }
function perfil(req, res) {
  res.render('Pages/perfil', { pagina: 'perfil', perfilId: '' });
}
function profissional(req, res) {
  res.render('Pages/profissional', { pagina: 'servicos', id: req.params.id });
}

async function apiMe(req, res) {
  if (!req.session.usuarioId) return res.status(401).json({ erro: 'Não autenticado.' });
  const usuario = await usuarioModel.buscarPorId(req.session.usuarioId);
  if (!usuario) return res.status(401).json({ erro: 'Usuário não encontrado.' });
  res.json(usuario);
}

async function apiLogin(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const senha = String(req.body.senha || '');
  const usuario = await usuarioModel.buscarPorEmail(email);
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  req.session.usuarioId = usuario.id_usuario;
  res.json(await usuarioModel.buscarPorId(usuario.id_usuario));
}

async function apiCadastro(req, res) {
  const nome = String(req.body.nome || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const senha = String(req.body.senha || '');
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
  if (await usuarioModel.buscarPorEmail(email)) return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
  const usuario = await usuarioModel.criar({ nome, email, senha });
  res.status(201).json({ ok: true, mensagem: 'Cadastro realizado com sucesso! Você já pode entrar.' });
}

async function apiAtualizarPerfil(req, res) {
  if (!req.session.usuarioId) return res.status(401).json({ erro: 'Não autenticado.' });
  const email = String(req.body.email || '').trim().toLowerCase();
  const outro = await usuarioModel.buscarPorEmail(email);
  if (outro && outro.id_usuario !== req.session.usuarioId) return res.status(409).json({ erro: 'Este e-mail já está em outro perfil.' });
  const atual = await usuarioModel.buscarPorId(req.session.usuarioId);
  const usuario = await usuarioModel.atualizar(req.session.usuarioId, { ...req.body, email, foto: req.body.foto === undefined ? atual.foto : (req.body.foto || null) });
  res.json(usuario);
}

function logout(req, res) {
  req.session.destroy(() => res.json({ ok: true }));
}

module.exports = { login, cadastro, perfil, profissional, apiMe, apiLogin, apiCadastro, apiAtualizarPerfil, logout };
