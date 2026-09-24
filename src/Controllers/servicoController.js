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

module.exports = { listar, detalhe, apiListar, apiDetalhe, exigirLogin, apiCriar, apiAtualizar, apiExcluir };
