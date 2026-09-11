document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     CARROSSEL — setas para rolar os cards
     ============================================================ */
  const carrossel = document.getElementById('carrosselJardineiros');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');

  if (carrossel && btnPrev && btnNext) {
      const scrollAmount = 360;

      btnNext.addEventListener('click', () => {
          carrossel.scrollBy({
              left: scrollAmount,
              behavior: 'smooth'
          });
      });

      btnPrev.addEventListener('click', () => {
          carrossel.scrollBy({
              left: -scrollAmount,
              behavior: 'smooth'
          });
      });
  }

  /* ============================================================
     BUSCA + FILTROS — categoria, cidade, avaliação e texto livre
     ============================================================ */
  const campoPesquisa = document.getElementById('campoPesquisa');
  const filtroCategoria = document.getElementById('filtroCategoria');
  const filtroCidade = document.getElementById('filtroCidade');
  const filtroAvaliacao = document.getElementById('filtroAvaliacao');
  const btnLimparFiltros = document.getElementById('btnLimparFiltros');
  const totalResultados = document.getElementById('totalResultados');
  const semResultados = document.getElementById('semResultados');
  const cards = document.querySelectorAll('.card-jardineiro');

  // Remove acentos para a busca não depender de digitar exatamente igual
  function normalizar(texto) {
      return (texto || '')
          .toString()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
  }

  function aplicarFiltros() {
      const termo = normalizar(campoPesquisa ? campoPesquisa.value.trim() : '');
      const categoria = filtroCategoria ? filtroCategoria.value : '';
      const cidade = filtroCidade ? filtroCidade.value : '';
      const avaliacaoMinima = filtroAvaliacao && filtroAvaliacao.value
          ? parseFloat(filtroAvaliacao.value)
          : 0;

      let visiveis = 0;

      cards.forEach((card) => {
          const nome = card.querySelector('h3') ? card.querySelector('h3').textContent : '';
          const cidadeCard = card.dataset.cidade || '';
          const categoriasCard = (card.dataset.categorias || '').split(',');
          const avaliacaoCard = parseFloat(card.dataset.avaliacao) || 0;

          const combinaBusca = !termo ||
              normalizar(nome).includes(termo) ||
              normalizar(cidadeCard).includes(termo) ||
              categoriasCard.some((cat) => normalizar(cat).includes(termo));

          const combinaCategoria = !categoria || categoriasCard.includes(categoria);
          const combinaCidade = !cidade || cidadeCard === cidade;
          const combinaAvaliacao = avaliacaoCard >= avaliacaoMinima;

          const visivel = combinaBusca && combinaCategoria && combinaCidade && combinaAvaliacao;

          card.style.display = visivel ? '' : 'none';
          if (visivel) visiveis += 1;
      });

      if (totalResultados) {
          const plural = visiveis === 1 ? '' : 's';
          totalResultados.textContent = `${visiveis} jardineiro${plural} encontrado${plural}`;
      }

      if (semResultados) {
          semResultados.style.display = visiveis === 0 ? 'block' : 'none';
      }

      if (carrossel) {
          carrossel.style.display = visiveis === 0 ? 'none' : 'flex';
      }
  }

  if (campoPesquisa) {
      campoPesquisa.addEventListener('input', aplicarFiltros);
  }

  [filtroCategoria, filtroCidade, filtroAvaliacao].forEach((select) => {
      if (select) select.addEventListener('change', aplicarFiltros);
  });

  if (btnLimparFiltros) {
      btnLimparFiltros.addEventListener('click', () => {
          if (campoPesquisa) campoPesquisa.value = '';
          if (filtroCategoria) filtroCategoria.value = '';
          if (filtroCidade) filtroCidade.value = '';
          if (filtroAvaliacao) filtroAvaliacao.value = '';
          aplicarFiltros();
      });
  }

  // Estado inicial (garante o contador certo mesmo sem interação)
  aplicarFiltros();
});