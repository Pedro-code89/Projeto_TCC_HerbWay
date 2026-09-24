const router = require('express').Router();
const servicoController = require('../Controllers/servicoController');

router.get('/servicos', servicoController.listar);
router.get('/servicos/:id', servicoController.detalhe);

router.get('/api/servicos', servicoController.apiListar);
router.get('/api/servicos/:id', servicoController.apiDetalhe);
router.post('/api/servicos', servicoController.exigirLogin, servicoController.apiCriar);
router.put('/api/servicos/:id', servicoController.exigirLogin, servicoController.apiAtualizar);
router.delete('/api/servicos/:id', servicoController.exigirLogin, servicoController.apiExcluir);

module.exports = router;
