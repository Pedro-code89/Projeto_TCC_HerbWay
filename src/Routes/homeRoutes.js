const router = require('express').Router();
const homeController = require('../Controllers/homeController');

router.get('/', homeController.home);
router.get('/dashboard', homeController.home);

module.exports = router;
