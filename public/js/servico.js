(async () => {
  await HerbWay.pronto;
  const servicoAtual = HerbWay.ler().servicos.find(item => String(item.id) === String(document.body.dataset.servico) && item.ativo);
  if (!servicoAtual) { document.querySelector('#servico-inexistente').hidden = false; return; }
  document.querySelector('#detalhe-conteudo').hidden = false;
  for (const campo of ['titulo', 'categoria', 'descricao']) document.getElementById('servico-' + campo).textContent = servicoAtual[campo];
  document.querySelector('#servico-local').textContent = `${servicoAtual.cidade}, ${servicoAtual.estado}`;
  document.querySelector('#servico-preco').textContent = HerbWay.moeda(servicoAtual.preco);
  HerbWay.aplicarAvatar(document.querySelector('#profissional-avatar'), { nome: servicoAtual.nome, foto: servicoAtual.foto });
  document.querySelector('#profissional-nome').textContent = HerbWay.nomeCurto(servicoAtual.nome);
  document.querySelector('#profissional-local').textContent = `${servicoAtual.cidade}, ${servicoAtual.estado}`;
  document.querySelector('#profissional-avaliacao').textContent = HerbWay.avaliacao(servicoAtual);
  document.querySelector('#ver-profissional').href = '/profissional/' + encodeURIComponent(servicoAtual.usuarioId);
  const proprio = HerbWay.conta()?.id === servicoAtual.usuarioId;
  document.querySelector('#registrar-contratacao').hidden = proprio;
  document.querySelector('#ajuda-contratacao').hidden = proprio;
  document.querySelector('#editar-anuncio').hidden = !proprio;
  document.querySelector('#editar-anuncio').href = '/perfil?editar=' + encodeURIComponent(servicoAtual.id);

  // Telefone: exibe a versão mascarada; desbloqueio exige login e busca o número real na API.
  const telefoneExibicao = document.querySelector('#telefone-exibicao');
  const telefoneBox = document.querySelector('#telefone-box');
  if (!servicoAtual.telefone) { telefoneBox.hidden = true; } else { telefoneExibicao.textContent = servicoAtual.telefone; }
  const botaoDesbloquear = document.querySelector('#desbloquear-telefone');
  const botaoCopiar = document.querySelector('#copiar-telefone');
  let telefoneReal = null;
  botaoDesbloquear.addEventListener('click', async () => {
    if (!HerbWay.conta()) { irParaLogin(); return; }
    botaoDesbloquear.disabled = true; botaoDesbloquear.textContent = 'Desbloqueando...';
    try {
      const resposta = await fetch('/api/servicos/' + encodeURIComponent(servicoAtual.id) + '/telefone');
      const corpo = await resposta.json();
      if (!resposta.ok) throw new Error(corpo.erro || 'Não foi possível desbloquear.');
      telefoneReal = corpo.telefone;
      telefoneExibicao.textContent = telefoneReal || 'Telefone não informado';
      botaoDesbloquear.hidden = true;
      botaoCopiar.hidden = !telefoneReal;
    } catch (erro) { mostrarAviso(erro.message); }
    finally { botaoDesbloquear.disabled = false; botaoDesbloquear.textContent = 'Desbloquear telefone'; }
  });
  botaoCopiar.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(telefoneReal || ''); mostrarAviso('Telefone copiado!'); }
    catch { mostrarAviso('Não foi possível copiar.'); }
  });

  // Formulário de contato com o profissional.
  const formMensagem = document.querySelector('#form-mensagem');
  formMensagem.addEventListener('submit', async evento => {
    evento.preventDefault();
    const nome = formMensagem.elements.nome.value.trim();
    const email = formMensagem.elements.email.value.trim();
    const telefone = formMensagem.elements.telefone.value.trim();
    const mensagem = formMensagem.elements.mensagem.value.trim();
    document.querySelector('#sucesso-mensagem').hidden = true;
    if (!nome || !email || !mensagem) { mostrarErro('erro-mensagem', 'Preencha nome, e-mail e mensagem.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { mostrarErro('erro-mensagem', 'Informe um e-mail válido.'); return; }
    mostrarErro('erro-mensagem', '');
    const botaoEnviar = document.querySelector('#enviar-mensagem');
    botaoEnviar.disabled = true; botaoEnviar.textContent = 'Enviando...';
    try {
      const resposta = await fetch('/api/servicos/' + encodeURIComponent(servicoAtual.id) + '/mensagens', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone, mensagem })
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(corpo.erro || 'Não foi possível enviar a mensagem.');
      document.querySelector('#sucesso-mensagem').hidden = false;
      formMensagem.reset();
      formMensagem.elements.mensagem.value = 'Olá, tenho interesse no seu serviço. Poderia me passar mais informações?';
    } catch (erro) { mostrarErro('erro-mensagem', erro.message); }
    finally { botaoEnviar.disabled = false; botaoEnviar.textContent = 'Enviar mensagem'; }
  });

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
