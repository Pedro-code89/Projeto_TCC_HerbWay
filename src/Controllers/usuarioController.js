const usuarioModel = require('../Models/usuarioModel');

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
  if (!usuario || usuario.senha !== senha) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
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
  req.session.usuarioId = usuario.id;
  res.status(201).json(usuario);
}

async function apiAtualizarPerfil(req, res) {
  if (!req.session.usuarioId) return res.status(401).json({ erro: 'Não autenticado.' });
  const email = String(req.body.email || '').trim().toLowerCase();
  const outro = await usuarioModel.buscarPorEmail(email);
  if (outro && outro.id_usuario !== req.session.usuarioId) return res.status(409).json({ erro: 'Este e-mail já está em outro perfil.' });
  const usuario = await usuarioModel.atualizar(req.session.usuarioId, { ...req.body, email });
  res.json(usuario);
}

function logout(req, res) {
  req.session.destroy(() => res.json({ ok: true }));
}

module.exports = { login, cadastro, perfil, profissional, apiMe, apiLogin, apiCadastro, apiAtualizarPerfil, logout };
