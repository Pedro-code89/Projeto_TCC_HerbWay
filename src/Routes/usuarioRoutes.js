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

router.get('/confirmar-email', usuarioController.confirmarEmail);
router.get('/esqueci-senha', usuarioController.paginaEsqueci);
router.get('/redefinir-senha', usuarioController.paginaRedefinir);
router.get('/reenviar-verificacao', usuarioController.paginaReenviar);
router.post('/api/recuperacao', usuarioController.apiEsqueci);
router.post('/api/redefinir', usuarioController.apiRedefinir);
router.post('/api/reenviar-verificacao', usuarioController.apiReenviar);

module.exports = router;
