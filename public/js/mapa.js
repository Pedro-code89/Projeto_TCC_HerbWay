(function () {
  function temCoords(lat, lng) {
    const la = Number(lat);
    const lo = Number(lng);

    return Number.isFinite(la) && Number.isFinite(lo) && !(la === 0 && lo === 0);
  }

  function renderizarMapaAproximado(containerId, lat, lng, mensagemId) {
    const container = document.getElementById(containerId);
    const mensagem = mensagemId ? document.getElementById(mensagemId) : null;

    if (!container) return null;

    if (container._herbwayMapa) {
      try {
        container._herbwayMapa.remove();
      } catch (_) {
        // O mapa anterior pode já ter sido removido.
      }

      container._herbwayMapa = null;
      container.innerHTML = '';
    }

    if (!temCoords(lat, lng) || typeof L === 'undefined') {
      container.hidden = true;
      if (mensagem) mensagem.hidden = false;
      return null;
    }

    container.hidden = false;
    if (mensagem) mensagem.hidden = true;

    const centro = [Number(lat), Number(lng)];
    let mapa;

    try {
      mapa = L.map(container, {
        scrollWheelZoom: false,
        attributionControl: true
      });

      // Define o centro e o zoom antes de calcular a área do círculo.
      mapa.setView(centro, 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapa);

      const circulo = L.circle(centro, {
        radius: 2000,
        color: '#2f855a',
        weight: 2,
        fillColor: '#48bb78',
        fillOpacity: 0.22
      }).addTo(mapa);

      mapa.fitBounds(circulo.getBounds(), { padding: [24, 24] });
      container._herbwayMapa = mapa;

      const ajustar = () => {
        if (container._herbwayMapa !== mapa) return;

        mapa.invalidateSize();
        mapa.fitBounds(circulo.getBounds(), { padding: [24, 24] });
      };

      setTimeout(ajustar, 0);
      setTimeout(ajustar, 200);
      setTimeout(ajustar, 600);

      return mapa;
    } catch (erro) {
      if (mapa) mapa.remove();

      container._herbwayMapa = null;
      container.hidden = true;
      if (mensagem) mensagem.hidden = false;

      console.warn('Não foi possível exibir o mapa aproximado.', erro);
      return null;
    }
  }

  window.HerbWayMapa = { temCoords, renderizarMapaAproximado };
})();