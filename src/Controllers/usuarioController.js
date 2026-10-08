const usuarioModel = require('../Models/usuarioModel');
const tokenModel = require('../Models/tokenModel');
const emailService = require('../Services/emailService');
const templates = require('../Services/emailTemplates');
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
  if (!usuario.email_verificado) return res.status(403).json({ erro: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada ou solicite um novo link de verificação.' });
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
  const token = await tokenModel.criar({ idUsuario: usuario.id, tipo: 'confirmacao', validadeHoras: 24 });
  const url = `${req.protocol}://${req.get('host')}/confirmar-email?token=${token}`;
  try {
    await emailService.enviar({ para: email, assunto: 'Confirme seu e-mail | HerbWay', html: templates.confirmacao({ nome, url }), texto: templates.textoConfirmacao({ nome, url }) });
  } catch (erro) { return res.status(502).json({ erro: erro.message }); }
  res.status(201).json({ ok: true, mensagem: 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.' });
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

function paginaConfirmar(req, res) { res.render('Pages/confirmar', { pagina: 'login' }); }
function paginaEsqueci(req, res) { res.render('Pages/esqueciSenha', { pagina: 'login' }); }
function paginaRedefinir(req, res) { res.render('Pages/redefinir', { pagina: 'login', token: req.query.token || '' }); }
function paginaReenviar(req, res) { res.render('Pages/reenviar', { pagina: 'login' }); }

async function confirmarEmail(req, res) {
  const token = await tokenModel.validar(String(req.query.token || ''), 'confirmacao');
  if (!token) return res.render('Pages/confirmar', { pagina: 'login', erro: 'Link inválido, expirado ou já utilizado. Solicite um novo e-mail de verificação.' });
  await usuarioModel.confirmarEmail(token.id_usuario);
  await tokenModel.marcarUsado(token.id_token);
  res.render('Pages/confirmar', { pagina: 'login', ok: true });
}

async function apiEsqueci(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (limitado('rec:' + email)) return res.status(429).json({ ok: true, mensagem: 'Se o e-mail estiver cadastrado, enviaremos instruções em breve.' });
  const usuario = await usuarioModel.buscarPorEmail(email);
  if (usuario) {
    const token = await tokenModel.criar({ idUsuario: usuario.id_usuario, tipo: 'recuperacao', validadeHoras: 1 });
    const url = `${req.protocol}://${req.get('host')}/redefinir-senha?token=${token}`;
    try { await emailService.enviar({ para: email, assunto: 'Redefina sua senha | HerbWay', html: templates.recuperacao({ nome: usuario.nome, url }), texto: templates.textoRecuperacao({ nome: usuario.nome, url }) }); }
    catch (erro) { return res.status(502).json({ erro: erro.message }); }
  }
  res.json({ ok: true, mensagem: 'Se o e-mail estiver cadastrado, enviaremos instruções em breve.' });
}

async function apiRedefinir(req, res) {
  const tokenStr = String(req.body.token || '');
  const senha = String(req.body.senha || '');
  const confirmar = String(req.body.confirmar_senha || '');
  if (senha.length < 6) return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  if (senha !== confirmar) return res.status(400).json({ erro: 'As senhas não coincidem.' });
  const token = await tokenModel.validar(tokenStr, 'recuperacao');
  if (!token) return res.status(400).json({ erro: 'Link inválido, expirado ou já utilizado. Solicite uma nova recuperação.' });
  await usuarioModel.atualizarSenha(token.id_usuario, senha);
  await tokenModel.marcarUsado(token.id_token);
  res.json({ ok: true, mensagem: 'Senha alterada com sucesso! Faça login com a nova senha.' });
}

async function apiReenviar(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (limitado('reen:' + email)) return res.status(429).json({ ok: true, mensagem: 'Se a conta existir e ainda não estiver verificada, enviaremos um novo link.' });
  const usuario = await usuarioModel.buscarPorEmail(email);
  if (usuario && !usuario.email_verificado) {
    const token = await tokenModel.criar({ idUsuario: usuario.id_usuario, tipo: 'confirmacao', validadeHoras: 24 });
    const url = `${req.protocol}://${req.get('host')}/confirmar-email?token=${token}`;
    try { await emailService.enviar({ para: email, assunto: 'Confirme seu e-mail | HerbWay', html: templates.confirmacao({ nome: usuario.nome, url }), texto: templates.textoConfirmacao({ nome: usuario.nome, url }) }); }
    catch (erro) { return res.status(502).json({ erro: erro.message }); }
  }
  res.json({ ok: true, mensagem: 'Se a conta existir e ainda não estiver verificada, enviaremos um novo link.' });
}

module.exports = { login, cadastro, perfil, profissional, apiMe, apiLogin, apiCadastro, apiAtualizarPerfil, logout, confirmarEmail, paginaConfirmar, paginaEsqueci, paginaRedefinir, paginaReenviar, apiEsqueci, apiRedefinir, apiReenviar };
