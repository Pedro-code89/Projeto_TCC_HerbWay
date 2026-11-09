const servicoModel = require('../Models/servicoModel');
const imagemService = require('../Services/imagemService');
const { geocodificarLocalizacao, localizacaoMudou } = require('../Services/geocodingService');
const visualizacaoModel = require('../Models/visualizacaoModel');

async function listar(req, res) {
  res.render('Pages/servicos', { pagina: 'servicos' });
}
async function detalhe(req, res) {
  try {
    const servico = await servicoModel.buscarPorId(req.params.id);
    if (servico) {
      visualizacaoModel.registrarServico({
        servicoId: req.params.id,
        alvoId: servico.usuarioId,
        visualizadorId: req.session.usuarioId,
        sessaoId: req.sessionID
      }).catch(() => {});
    }
  } catch (_) {}
  res.render('Pages/servico', { pagina: 'servicos', id: req.params.id });
}

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
  const dados = { ...req.body };
  if (String(dados.cidade || '').trim() && String(dados.estado || '').trim()) {
    const coords = await geocodificarLocalizacao({ cidade: dados.cidade, estado: dados.estado });
    dados.latitude = coords ? coords.latitude : null;
    dados.longitude = coords ? coords.longitude : null;
  }
  const servico = await servicoModel.criar(req.session.usuarioId, dados);
  let fotosSolicitadas = false;
  if (Object.prototype.hasOwnProperty.call(req.body, 'fotos')) {
    fotosSolicitadas = Array.isArray(req.body.fotos) && req.body.fotos.length > 0;
    if (!Array.isArray(req.body.fotos)) return res.status(400).json({ erro: 'Formato de imagens inválido.' });
    const fotosJson = await imagemService.processarFotos(servico.id, req.body.fotos);
    if (fotosJson !== undefined) await servicoModel.atualizarFotos(servico.id, req.session.usuarioId, fotosJson);
    if (fotosSolicitadas && fotosJson === JSON.stringify([])) {
      await imagemService.removerPastaFotos(servico.id).catch(() => {});
      return res.status(400).json({ erro: 'As imagens não puderam ser processadas. Use arquivos JPG, PNG, WEBP ou GIF com até 2 MB.' });
    }
  }
  const salvo = await servicoModel.buscarPorId(servico.id);
  if (fotosSolicitadas && !(salvo && Array.isArray(salvo.fotosLista) && salvo.fotosLista.length)) {
    return res.status(500).json({ erro: 'As imagens foram processadas, mas não foi possível confirmar o registro no banco. Verifique a coluna "fotos" em anuncios e o terminal do Node.' });
  }
  res.status(201).json(salvo);
}
async function apiAtualizar(req, res) {
  const atual = await servicoModel.buscarPorId(req.params.id);
  if (!atual) return res.status(404).json({ erro: 'Serviço não encontrado.' });
  const dados = { ...req.body };
  const semCoords = !(atual && atual.latitude != null && atual.longitude != null);
  if (localizacaoMudou(atual, dados) || (semCoords && String(dados.cidade || '').trim() && String(dados.estado || '').trim())) {
    if (String(dados.cidade || '').trim() && String(dados.estado || '').trim()) {
      const coords = await geocodificarLocalizacao({ cidade: dados.cidade, estado: dados.estado });
      dados.latitude = coords ? coords.latitude : null;
      dados.longitude = coords ? coords.longitude : null;
    } else {
      dados.latitude = null;
      dados.longitude = null;
    }
  }
  await servicoModel.atualizar(req.params.id, req.session.usuarioId, dados);
  let fotosSolicitadas = false;
  if (Object.prototype.hasOwnProperty.call(req.body, 'fotos')) {
    fotosSolicitadas = Array.isArray(req.body.fotos) && req.body.fotos.length > 0;
    if (!Array.isArray(req.body.fotos)) return res.status(400).json({ erro: 'Formato de imagens inválido.' });
    const fotosJson = await imagemService.processarFotos(req.params.id, req.body.fotos);
    if (fotosJson !== undefined) await servicoModel.atualizarFotos(req.params.id, req.session.usuarioId, fotosJson);
    if (fotosSolicitadas && fotosJson === JSON.stringify([])) {
      return res.status(400).json({ erro: 'As imagens não puderam ser processadas. Use arquivos JPG, PNG, WEBP ou GIF com até 2 MB.' });
    }
  }
  const salvo = await servicoModel.buscarPorId(req.params.id);
  if (fotosSolicitadas && !(salvo && Array.isArray(salvo.fotosLista) && salvo.fotosLista.length)) {
    return res.status(500).json({ erro: 'As imagens foram processadas, mas não foi possível confirmar o registro no banco. Verifique a coluna "fotos" em anuncios e o terminal do Node.' });
  }
  res.json(salvo);
}
async function apiExcluir(req, res) {
  await servicoModel.excluir(req.params.id, req.session.usuarioId);
  await imagemService.removerPastaFotos(req.params.id);
  res.json({ ok: true });
}

async function apiTelefone(req, res) {
  const usuario = await require('../Models/usuarioModel').buscarPorId(req.session.usuarioId);
  if (!usuario) return res.status(403).json({ erro: 'Faça login para desbloquear telefones.' });
  const servico = await servicoModel.buscarPorId(req.params.id);
  if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado.' });
  const telefone = await servicoModel.buscarTelefone(req.params.id);
  res.json({ telefone });
}

async function apiFotos(req, res) {
  const fotos = await servicoModel.buscarFotos(req.params.id);
  res.json(fotos);
}

module.exports = { listar, detalhe, apiListar, apiDetalhe, exigirLogin, apiCriar, apiAtualizar, apiExcluir, apiTelefone, apiFotos };
