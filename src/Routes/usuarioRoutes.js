const router = require('express').Router();
const usuarioController = require('../Controllers/usuarioController');

router.get('/login', usuarioController.login);
router.post('/login', usuarioController.apiLogin);
router.get('/cadastro', usuarioController.cadastro);
router.post('/cadastro', usuarioController.apiCadastro);
router.get('/perfil', usuarioController.perfil);
router.get('/profissional/:id', usuarioController.profissional);

router.get('/api/me', usuarioController.apiMe);
router.put('/api/perfil', usuarioController.apiAtualizarPerfil);
router.post('/api/logout', usuarioController.logout);

module.exports = router;
