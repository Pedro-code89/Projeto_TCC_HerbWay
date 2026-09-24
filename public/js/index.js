const pesquisa = document.querySelector('#campoPesquisa');
const categoria = document.querySelector('#filtroCategoria');
const cidade = document.querySelector('#filtroCidade');
const avaliacao = document.querySelector('#filtroAvaliacao');
function normalizar(texto) { return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function atualizarCidades() {
  const anterior = cidade.value;
  cidade.replaceChildren(new Option('Todas as cidades', ''));
  const cidades = [...new Set(HerbWay.ler().servicos.filter(item => item.ativo).map(item => item.cidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  cidades.forEach(item => cidade.add(new Option(item, item)));
  if (cidades.includes(anterior)) cidade.value = anterior;
}
function filtrar() {
  const termo = normalizar(pesquisa.value.trim());
  const lista = HerbWay.ler().servicos.filter(servico => {
    const ativo = Number(servico.ativo) === 1 || servico.ativo === true;

    if (!ativo) return false;
    const texto = normalizar([servico.titulo, servico.descricao, servico.categoria, servico.cidade, servico.titulo].join(' '));
    return texto.includes(termo) && (!categoria.value || servico.categoria === categoria.value) && (!cidade.value || servico.cidade === cidade.value) && (!avaliacao.value || Math.round(Number(servico.avaliacao)) === Number(avaliacao.value));
  });
  mostrarCatalogo(lista);
  document.querySelector('#lista-servicos').scrollLeft = 0;
}
pesquisa.addEventListener('input', filtrar);
[categoria, cidade, avaliacao].forEach(campo => campo.addEventListener('change', filtrar));
document.querySelector('#btnLimparFiltros')?.addEventListener('click', () => { [pesquisa, categoria, cidade, avaliacao].forEach(campo => { campo.value = ''; }); filtrar(); });
window.addEventListener('herbway:atualizado', () => { atualizarCidades(); filtrar(); });
const carrossel = document.querySelector('.lista-carrossel');
if (carrossel) {
  function atualizarSetas() { document.querySelector('#btnPrev').disabled = carrossel.scrollLeft < 2; document.querySelector('#btnNext').disabled = carrossel.scrollLeft + carrossel.clientWidth >= carrossel.scrollWidth - 2; }
  for (const [id, direcao] of [['btnPrev', -1], ['btnNext', 1]]) document.getElementById(id).addEventListener('click', () => carrossel.scrollBy({ left: (carrossel.querySelector('article')?.offsetWidth + 20 || 360) * direcao, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  carrossel.addEventListener('scroll', atualizarSetas); new ResizeObserver(atualizarSetas).observe(carrossel); new MutationObserver(atualizarSetas).observe(carrossel, { childList: true });
}
HerbWay.pronto.then(() => { atualizarCidades(); filtrar(); });
