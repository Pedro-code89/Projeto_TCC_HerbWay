const servicoModel = require('../Models/servicoModel');

async function listar(req, res) {
  res.render('Pages/servicos', { pagina: 'servicos' });
}
function detalhe(req, res) { res.render('Pages/servico', { pagina: 'servicos', id: req.params.id }); }

async function apiListar(req, res) { res.json(await servicoModel.listar()); }
async function apiDetalhe(req, res) {
  const servico = await servicoModel.buscarPorId(req.params.id);
  if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado.' });
  res.json(servico);
}
function exigirLogin(req, res, next) {
  if (!req.session.usuarioId) return res.status(401).json({ erro: 'Faça login para continuar.' });
  next();
}
async function apiCriar(req, res) {
  const servico = await servicoModel.criar(req.session.usuarioId, req.body);
  res.status(201).json(servico);
}
async function apiAtualizar(req, res) {
  const servico = await servicoModel.atualizar(req.params.id, req.session.usuarioId, req.body);
  res.json(servico);
}
async function apiExcluir(req, res) {
  await servicoModel.excluir(req.params.id, req.session.usuarioId);
  res.json({ ok: true });
}

async function apiTelefone(req, res) {
  const usuario = await require('../Models/usuarioModel').buscarPorId(req.session.usuarioId);
  if (!usuario || !usuario.email_verificado) return res.status(403).json({ erro: 'Confirme seu e-mail para desbloquear telefones.' });
  const servico = await servicoModel.buscarPorId(req.params.id);
  if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado.' });
  const telefone = await servicoModel.buscarTelefone(req.params.id);
  res.json({ telefone });
}

async function apiMensagem(req, res) {
  const nome = String(req.body.nome || '').trim();
  const email = String(req.body.email || '').trim();
  const telefone = String(req.body.telefone || '').trim();
  const mensagem = String(req.body.mensagem || '').trim();
  if (!nome || !email || !mensagem) return res.status(400).json({ erro: 'Preencha nome, e-mail e mensagem.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: 'E-mail inválido.' });
  const servico = await servicoModel.buscarPorId(req.params.id);
  if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado.' });
  await servicoModel.criarMensagem(req.params.id, { nome, email, telefone, mensagem });
  res.status(201).json({ ok: true });
}

module.exports = { listar, detalhe, apiListar, apiDetalhe, exigirLogin, apiCriar, apiAtualizar, apiExcluir, apiTelefone, apiMensagem };
