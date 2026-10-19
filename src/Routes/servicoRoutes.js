const router = require('express').Router();
const servicoController = require('../Controllers/servicoController');

router.get('/servicos', servicoController.listar);
router.get('/servicos/:id', servicoController.detalhe);

router.get('/api/servicos', servicoController.apiListar);
router.get('/api/servicos/:id', servicoController.apiDetalhe);
router.post('/api/servicos', servicoController.exigirLogin, servicoController.apiCriar);
router.put('/api/servicos/:id', servicoController.exigirLogin, servicoController.apiAtualizar);
router.delete('/api/servicos/:id', servicoController.exigirLogin, servicoController.apiExcluir);
router.get('/api/servicos/:id/telefone', servicoController.exigirLogin, servicoController.apiTelefone);
router.get('/api/servicos/:id/fotos', servicoController.apiFotos);

module.exports = router;
