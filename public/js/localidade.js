// HerbWay - Seleção dependente de Estado e Cidade
// Dados oficiais dos municípios brasileiros (IBGE), consumidos via API local do próprio servidor.

const ESTADO_SELETOR = 'select[name="estado"]';
const CIDADE_SELETOR = 'select[name="cidade"]';

let cacheEstados = null;
const cacheMunicipios = {};

async function requisicaoJson(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao carregar ${url}`);
  return resposta.json();
}

async function carregarEstados() {
  if (cacheEstados) return cacheEstados;
  cacheEstados = await requisicaoJson('/api/localidades/estados');
  return cacheEstados;
}

async function carregarMunicipios(uf) {
  const sigla = String(uf || '').toUpperCase();
  if (cacheMunicipios[sigla]) return cacheMunicipios[sigla];
  const municipios = await requisicaoJson(`/api/localidades/municipios?uf=${encodeURIComponent(sigla)}`);
  cacheMunicipios[sigla] = municipios;
  return municipios;
}

function criarOption(texto, valor) {
  const opcao = document.createElement('option');
  opcao.value = valor;
  opcao.textContent = texto;
  return opcao;
}

function exibirMensagem(elemento, mensagem) {
  if (!elemento) return;
  elemento.textContent = mensagem;
  elemento.hidden = !mensagem;
}

/**
 * Inicializa a seleção dependente estado -> cidade em um formulário.
 */
async function inicializarSelecaoLocalidade(formulario, opcoes = {}) {
  const {
    estadoSelecaoInicial,
    cidadeSelecaoInicial,
    cidadeObrigatorio = true,
    msgErroCidade = null
  } = opcoes;

  const estadoSelect = formulario.querySelector(ESTADO_SELETOR);
  const cidadeSelect = formulario.querySelector(CIDADE_SELETOR);
  if (!estadoSelect || !cidadeSelect) {
    console.error('[Localidade] Selects de estado/cidade não encontrados.');
    return;
  }

  // Reset dos selects
  estadoSelect.disabled = false;
  cidadeSelect.disabled = true;
  estadoSelect.replaceChildren(criarOption('Selecione um estado', ''));
  cidadeSelect.replaceChildren(criarOption('Selecione primeiro o estado', ''));
  estadoSelect.selectedIndex = 0;
  cidadeSelect.selectedIndex = 0;

  let carregandoMunicipios = false;

  async function popularEstados() {
    try {
      const estados = await carregarEstados();
      estados.forEach(e => {
        estadoSelect.add(criarOption(e.nome, e.sigla));
      });
      if (estadoSelecaoInicial) {
        estadoSelect.value = estadoSelecaoInicial;
      }
    } catch (erro) {
      console.error('[Localidade] Falha ao carregar estados:', erro);
      estadoSelect.replaceChildren(criarOption('Erro ao carregar estados', ''));
    }
  }

  async function popularMunicipios(uf) {
    if (!uf) return;
    carregandoMunicipios = true;
    cidadeSelect.disabled = true;
    cidadeSelect.replaceChildren(criarOption('Carregando municípios...', ''));
    cidadeSelect.selectedIndex = 0;
    exibirMensagem(msgErroCidade, '');

    try {
      const municipios = await carregarMunicipios(uf);
      cidadeSelect.replaceChildren(criarOption('Selecione uma cidade', ''));
      municipios.forEach(m => cidadeSelect.add(criarOption(m, m)));
      cidadeSelect.disabled = false;

      if (cidadeSelecaoInicial && municipios.includes(cidadeSelecaoInicial)) {
        cidadeSelect.value = cidadeSelecaoInicial;
      } else if (cidadeSelecaoInicial) {
        exibirMensagem(msgErroCidade, 'A cidade cadastrada não está na lista oficial do estado. Selecione uma cidade válida.');
      }
    } catch (erro) {
      cidadeSelect.replaceChildren(criarOption('Não foi possível carregar municípios.', ''));
      cidadeSelect.disabled = true;
      exibirMensagem(msgErroCidade, 'Não foi possível carregar as cidades deste estado. Tente novamente.');
      console.error('[Localidade] Falha ao carregar municípios:', erro);
    } finally {
      carregandoMunicipios = false;
    }
  }

  await popularEstados();

  if (estadoSelecaoInicial) {
    await popularMunicipios(estadoSelecaoInicial);
  }

  // Evento de mudança de estado (change e click como fallback)
  function aoMudarEstado() {
    const uf = estadoSelect.value;
    if (!uf) {
      cidadeSelect.disabled = true;
      cidadeSelect.replaceChildren(criarOption('Selecione primeiro o estado', ''));
      cidadeSelect.selectedIndex = 0;
      exibirMensagem(msgErroCidade, '');
      return;
    }
    popularMunicipios(uf);
  }

  estadoSelect.addEventListener('change', aoMudarEstado);
  estadoSelect.addEventListener('click', aoMudarEstado);

  // Validação de envio do formulário
  formulario.addEventListener('submit', async (evento) => {
    if (!cidadeObrigatorio) return;
    if (carregandoMunicipios) {
      evento.preventDefault();
      exibirMensagem(msgErroCidade, 'Aguarde o carregamento das cidades.');
      return;
    }
    const uf = estadoSelect.value;
    const cidade = cidadeSelect.value;
    if (!uf || !cidade || cidade === 'Selecione primeiro o estado' || cidade === 'Selecione uma cidade') {
      evento.preventDefault();
      exibirMensagem(msgErroCidade, 'Selecione o estado e a cidade antes de salvar.');
      return;
    }
    try {
      const municipios = await carregarMunicipios(uf);
      if (!municipios.includes(cidade)) {
        evento.preventDefault();
        exibirMensagem(msgErroCidade, 'Cidade inválida para o estado selecionado.');
        return;
      }
    } catch {
      evento.preventDefault();
      exibirMensagem(msgErroCidade, 'Não foi possível validar a cidade. Tente novamente.');
      return;
    }
    exibirMensagem(msgErroCidade, '');
  });

  return { estadoSelect, cidadeSelect };
}

window.HerbWayLocalidade = {
  inicializarSelecaoLocalidade,
  carregarEstados,
  carregarMunicipios,
  criarOption
};
