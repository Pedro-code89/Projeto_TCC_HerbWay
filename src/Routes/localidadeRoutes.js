const router = require('express').Router();
const localidadeService = require('../Services/localidadeService');

// Lista todos os estados brasileiros (UF + nome).
router.get('/api/localidades/estados', (req, res) => {
  res.json(localidadeService.listarEstados());
});

// Lista os municípios de um estado informado pelo parâmetro ?uf=SP.
// Retorna 400 se a UF for inválida.
router.get('/api/localidades/municipios', (req, res) => {
  const uf = String(req.query.uf || '').toUpperCase();
  if (!localidadeService.ufValida(uf)) {
    return res.status(400).json({ erro: 'Estado (UF) inválido.' });
  }
  res.json(localidadeService.listarMunicipios(uf));
});

module.exports = router;
