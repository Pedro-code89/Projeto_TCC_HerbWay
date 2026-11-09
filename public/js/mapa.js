(function () {
  function temCoords(lat, lng) {
    const la = Number(lat), lo = Number(lng);
    return Number.isFinite(la) && Number.isFinite(lo) && !(la === 0 && lo === 0);
  }

  function renderizarMapaAproximado(containerId, lat, lng, mensagemId) {
    const container = document.getElementById(containerId);
    const mensagem = mensagemId ? document.getElementById(mensagemId) : null;
    if (!container) return null;
    if (container._herbwayMapa) {
      try { container._herbwayMapa.remove(); } catch (_) {}
      container._herbwayMapa = null;
      container.innerHTML = '';
    }
    if (!temCoords(lat, lng) || typeof L === 'undefined') {
      container.hidden = true;
      if (mensagem) mensagem.hidden = false;
      return null;
    }
    if (mensagem) mensagem.hidden = true;
    container.hidden = false;
    const centro = [Number(lat), Number(lng)];
    const mapa = L.map(container, { scrollWheelZoom: false, attributionControl: true });
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
    const ajustar = () => { try { mapa.invalidateSize(); mapa.fitBounds(circulo.getBounds(), { padding: [24, 24] }); } catch (_) {} };
    setTimeout(ajustar, 0);
    setTimeout(ajustar, 200);
    setTimeout(ajustar, 600);
    return mapa;
  }

  window.HerbWayMapa = { temCoords, renderizarMapaAproximado };
})();