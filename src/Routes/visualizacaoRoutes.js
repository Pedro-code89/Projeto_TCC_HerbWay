const router = require('express').Router();
const visualizacaoController = require('../Controllers/visualizacaoController');

// Estatísticas privadas (somente proprietário)
router.get('/api/usuarios/:id/visualizacoes', visualizacaoController.exigirLogin, visualizacaoController.statsPerfil);
router.get('/api/servicos/:id/visualizacoes', visualizacaoController.exigirLogin, visualizacaoController.statsServico);

module.exports = router;
