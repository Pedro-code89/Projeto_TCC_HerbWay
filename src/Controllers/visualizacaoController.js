const visualizacaoModel = require('../Models/visualizacaoModel');

function exigirLogin(req, res, next) {
  if (!req.session.usuarioId) return res.status(401).json({ erro: 'Faça login para continuar.' });
  next();
}

async function statsPerfil(req, res) {
  const periodo = ['7d', '30d', 'total'].includes(req.query.periodo) ? req.query.periodo : 'total';
  const dados = await visualizacaoModel.obterEstatisticasPerfil({
    alvoId: req.params.id,
    solicitanteId: req.session.usuarioId,
    periodo
  });
  res.json(dados);
}

async function statsServico(req, res) {
  const periodo = ['7d', '30d', 'total'].includes(req.query.periodo) ? req.query.periodo : 'total';
  const dados = await visualizacaoModel.obterEstatisticasServico({
    servicoId: req.params.id,
    solicitanteId: req.session.usuarioId,
    periodo
  });
  res.json(dados);
}

module.exports = { exigirLogin, statsPerfil, statsServico };
