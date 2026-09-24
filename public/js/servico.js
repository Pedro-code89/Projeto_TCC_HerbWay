(async () => {
  await HerbWay.pronto;
  const servicoAtual = HerbWay.ler().servicos.find(item => String(item.id) === String(document.body.dataset.servico) && item.ativo);
  if (!servicoAtual) { document.querySelector('#servico-inexistente').hidden = false; return; }
  document.querySelector('#detalhe-conteudo').hidden = false;
  for (const campo of ['titulo', 'categoria', 'descricao']) document.getElementById('servico-' + campo).textContent = servicoAtual[campo];
  document.querySelector('#servico-local').textContent = `${servicoAtual.cidade}, ${servicoAtual.estado}`;
  document.querySelector('#servico-preco').textContent = HerbWay.moeda(servicoAtual.preco);
  document.querySelector('#profissional-avatar').textContent = HerbWay.iniciais(servicoAtual.nome);
  document.querySelector('#profissional-nome').textContent = HerbWay.nomeCurto(servicoAtual.nome);
  document.querySelector('#profissional-local').textContent = `${servicoAtual.cidade}, ${servicoAtual.estado}`;
  document.querySelector('#profissional-avaliacao').textContent = HerbWay.avaliacao(servicoAtual);
  document.querySelector('#ver-profissional').href = '/profissional/' + encodeURIComponent(servicoAtual.usuarioId);
  const proprio = HerbWay.conta()?.id === servicoAtual.usuarioId;
  document.querySelector('#registrar-contratacao').hidden = proprio;
  document.querySelector('#ajuda-contratacao').hidden = proprio;
  document.querySelector('#editar-anuncio').hidden = !proprio;
  document.querySelector('#editar-anuncio').href = '/perfil?editar=' + encodeURIComponent(servicoAtual.id);

  // Avaliações deste anúncio (mais recentes primeiro), empilhadas com rolagem própria.
  const avaliacoes = (HerbWay.ler().avaliacoes || []).filter(item => String(item.servicoId) === String(servicoAtual.id));
  const listaAvaliacoes = document.querySelector('#lista-avaliacoes');
  document.querySelector('#avaliacoes-vazio').hidden = avaliacoes.length > 0;
  listaAvaliacoes.hidden = avaliacoes.length === 0;
  avaliacoes.forEach(item => {
    const bloco = document.createElement('li');
    bloco.className = 'avaliacao-item';
    const cabecalho = document.createElement('p');
    cabecalho.className = 'avaliacao-cabecalho';
    const autor = document.createElement('strong');
    autor.textContent = HerbWay.nomeCurto(item.cliente);
    const estrelas = document.createElement('span');
    estrelas.className = 'nota';
    estrelas.textContent = HerbWay.estrelas(item.nota);
    estrelas.title = item.nota + ' — ' + HerbWay.rotulosNota[item.nota - 1];
    cabecalho.append(autor, estrelas);
    bloco.append(cabecalho);
    if (item.comentario) {
      const comentario = document.createElement('p');
      comentario.className = 'avaliacao-comentario';
      comentario.textContent = '"' + item.comentario + '"';
      bloco.append(comentario);
    }
    listaAvaliacoes.append(bloco);
  });
  document.querySelector('#avaliacoes-servico').hidden = false;

  let arrastando = false, arrastarY = 0, arrastarTopo = 0;
  listaAvaliacoes.addEventListener('pointerdown', evento => {
    if (evento.button !== 0 || listaAvaliacoes.scrollHeight <= listaAvaliacoes.clientHeight) return;
    arrastando = true; arrastarY = evento.clientY; arrastarTopo = listaAvaliacoes.scrollTop;
    listaAvaliacoes.classList.add('arrastando');
    listaAvaliacoes.setPointerCapture(evento.pointerId);
    evento.preventDefault();
  });
  listaAvaliacoes.addEventListener('pointermove', evento => {
    if (arrastando) listaAvaliacoes.scrollTop = arrastarTopo - (evento.clientY - arrastarY);
  });
  const soltarArrasto = () => { arrastando = false; listaAvaliacoes.classList.remove('arrastando'); };
  listaAvaliacoes.addEventListener('pointerup', soltarArrasto);
  listaAvaliacoes.addEventListener('pointercancel', soltarArrasto);

  const formContratacao = document.querySelector('#form-contratacao');
  const modalContratacao = document.querySelector('#modal-contratacao');
  document.querySelector('#registrar-contratacao').addEventListener('click', () => {
    if (!HerbWay.conta()) { irParaLogin(); return; }
    const hoje = new Date();
    formContratacao.elements.data.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    mostrarErro('erro-contratacao', ''); modalContratacao.showModal();
  });
  formContratacao.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (!formContratacao.reportValidity()) return;
    try { await HerbWay.contratar(servicoAtual.id, formContratacao.elements.data.value); location.assign('/perfil?aba=contratados'); }
    catch (erro) { mostrarErro('erro-contratacao', erro.message); }
  });
})();
