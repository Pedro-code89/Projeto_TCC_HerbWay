const localidade = require('./dadosLocalidade');

/**
 * Serviço de localidade (estados e municípios oficiais do IBGE).
 * Os dados estão embaralhados localmente (dadosLocalidade.js) para que
 * o servidor possa validar cidade/estado mesmo sem acesso à API externa.
 */

function listarEstados() {
  return localidade.ESTADOS;
}

function listarMunicipios(uf) {
  return localidade.listarMunicipios(uf);
}

function validarLocalidade(uf, cidade) {
  return localidade.validarLocalidade(uf, cidade);
}

function ufValida(uf) {
  return localidade.ufValida(uf);
}

module.exports = {
  listarEstados,
  listarMunicipios,
  validarLocalidade,
  ufValida,
  ESTADOS: localidade.ESTADOS,
  MUNICIPIOS_POR_ESTADO: localidade.MUNICIPIOS_POR_ESTADO
};
