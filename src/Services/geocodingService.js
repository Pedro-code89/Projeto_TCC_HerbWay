const ESTADOS_NOME = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
};

let ultimaConsulta = 0;
const INTERVALO_MS = 1100; // respeita limite de uso (1 req/s)

function esperar(ms) { return new Promise(r => setTimeout(r, ms)); }

async function respeitarLimite() {
  const agora = Date.now();
  const delta = agora - ultimaConsulta;
  if (delta < INTERVALO_MS) await esperar(INTERVALO_MS - delta);
  ultimaConsulta = Date.now();
}

function normalizar(valor) {
  return valor == null ? '' : String(valor).trim();
}

function montarConsulta({ bairro, cidade, estado }) {
  const uf = normalizar(estado).toUpperCase();
  const nomeEstado = ESTADOS_NOME[uf] || uf;
  // Apenas bairro/região, cidade e estado (nunca endereço residencial completo).
  return [normalizar(bairro), normalizar(cidade), nomeEstado, 'Brasil'].filter(Boolean).join(', ');
}

// Arredonda para exposição pública (localização aproximada), sem alterar o significado de área.
function coordenadaPublica(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1000) / 1000; // ~111m
}

async function geocodificarLocalizacao({ bairro, cidade, estado }) {
  const q = montarConsulta({ bairro, cidade, estado });
  if (!normalizar(cidade) || !normalizar(estado)) return null;
  await respeitarLimite();
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', q);
  url.searchParams.set('countrycodes', 'br');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'HerbWay-TCC/1.0 (aplicacao educacional; geocodificacao de cidade/bairro)',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      },
      signal: controller.signal
    });
    if (!resp.ok) {
      console.warn('[geocoding] Nominatim respondeu', resp.status, 'para:', q);
      return null;
    }
    const dados = await resp.json();
    if (!Array.isArray(dados) || !dados.length) {
      console.warn('[geocoding] sem resultado para:', q);
      return null;
    }
    const lat = Number(dados[0].lat);
    const lon = Number(dados[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { latitude: lat, longitude: lon };
  } catch (e) {
    console.warn('[geocoding] falha ao consultar Nominatim:', e.message, '|', q);
    return null; // falha de rede/limite: mantém dados existentes / sem coordenadas
  } finally {
    clearTimeout(timeout);
  }
}

function localizacaoMudou(atual, nova) {
  const a = atual || {};
  const n = nova || {};
  return normalizar(a.cidade) !== normalizar(n.cidade)
    || normalizar(a.estado).toUpperCase() !== normalizar(n.estado).toUpperCase()
    || normalizar(a.bairro) !== normalizar(n.bairro);
}

module.exports = { geocodificarLocalizacao, coordenadaPublica, localizacaoMudou, montarConsulta };
