(async () => {
  await HerbWay.pronto;
  const idPublico = document.body.dataset.perfilId;
  const formPerfil = document.querySelector('#form-perfil');
  const formServico = document.querySelector('#form-servico');
  const modalPerfil = document.querySelector('#modal-perfil');
  const modalDetalhes = document.querySelector('#modal-detalhes');
  const modalAvaliacao = document.querySelector('#modal-avaliacao');
  const estrelas = [...document.querySelectorAll('#modal-avaliacao .estrela')];
  const abas = [...document.querySelectorAll('.aba')];
  const camposPerfil = ['nome', 'email', 'telefone', 'cidade', 'estado', 'bairro', 'sobre'];
  let idEdicao = null;
  let idContratacao = null;
  let notaSelecionada = 0;
  let fotoSelecionada = null;

  const preencher = (seletor, valor) => document.querySelector(seletor).textContent = valor ?? '';

  function mostrarPerfil(perfil, proprio, servicos) {
    document.querySelector('#card-perfil').hidden = false;
    document.querySelectorAll('[data-proprio]').forEach(e => e.hidden = !proprio);
    document.querySelector('#sobre-publico').hidden = proprio;
    document.querySelector('#servicos-publicos').hidden = proprio;
    preencher('#titulo-pagina', proprio ? 'Meu perfil' : 'Perfil');
    preencher('#nome-perfil', proprio ? HerbWay.nomeCurto(perfil.nome) : perfil.nome);
    HerbWay.aplicarAvatar(document.querySelector('#avatar'), perfil);
    preencher('#local-perfil', [perfil.cidade, perfil.estado].filter(Boolean).join(', ') || 'Localização não informada');
    preencher('#tipo-perfil', servicos.some(s => s.ativo) ? 'Oferece serviços' : 'Perfil pessoal');
    preencher('#descricao-publica', perfil.sobre || 'Este perfil ainda não adicionou uma descrição.');
    const fonte = proprio && HerbWay.conta() ? HerbWay.conta() : perfil;
    camposPerfil.forEach(campo => preencher('#dado-' + campo, proprio ? (campo === 'estado' ? (HerbWay.estados[fonte.estado] || 'Não informado') : (fonte[campo] || 'Não informado')) : ''));
  }

  document.querySelector('#editar-perfil').addEventListener('click', () => {
    const perfil = HerbWay.conta();
    if (!perfil) return irParaLogin();
    camposPerfil.forEach(campo => formPerfil.elements[campo].value = perfil[campo] || '');
    fotoSelecionada = null; formPerfil.elements.foto.value = ''; document.querySelector('#preview-foto').hidden = true;
    mostrarErro('erro-perfil', ''); modalPerfil.showModal();
  });
  formPerfil.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (!validarFormulario(formPerfil)) return;
    const campos = {};
    camposPerfil.forEach(campo => campos[campo] = formPerfil.elements[campo].value.trim());
    if (fotoSelecionada) campos.foto = fotoSelecionada;
    try { await HerbWay.editarPerfil(campos); modalPerfil.close(); mostrarAviso('Perfil atualizado com sucesso.'); }
    catch (erro) { mostrarErro('erro-perfil', erro.message); }
  });
  formPerfil.elements.foto.addEventListener('change', () => {
    const arquivo = formPerfil.elements.foto.files[0];
    if (!arquivo) { fotoSelecionada = null; return; }
    if (!arquivo.type.startsWith('image/')) { mostrarErro('erro-perfil', 'Selecione um arquivo de imagem.'); return; }
    if (arquivo.size > 5 * 1024 * 1024) { mostrarErro('erro-perfil', 'A foto deve ter no máximo 5 MB.'); return; }
    const leitor = new FileReader();
    leitor.onload = () => { fotoSelecionada = leitor.result; const preview = document.querySelector('#preview-foto'); preview.src = fotoSelecionada; preview.hidden = false; };
    leitor.readAsDataURL(arquivo);
  });

  function trocarAba(painel, atualizarEndereco = true) {
    if (!abas.some(aba => aba.dataset.painel === painel)) painel = 'contratados';
    abas.forEach(aba => {
      const ativa = aba.dataset.painel === painel;
      aba.classList.toggle('ativa', ativa); aba.setAttribute('aria-selected', String(ativa)); aba.tabIndex = ativa ? 0 : -1;
      document.getElementById('painel-' + aba.dataset.painel).hidden = !ativa;
    });
    if (atualizarEndereco) {
      const url = new URL(location.href); url.search = ''; url.searchParams.set('aba', painel);
      if (painel === 'postar' && idEdicao) url.searchParams.set('editar', idEdicao);
      history.replaceState(null, '', url.pathname + url.search);
    }
  }
  abas.forEach((aba, indice) => {
    aba.addEventListener('click', () => trocarAba(aba.dataset.painel));
    aba.addEventListener('keydown', evento => {
      let proximo;
      if (evento.key === 'ArrowRight') proximo = (indice + 1) % abas.length;
      if (evento.key === 'ArrowLeft') proximo = (indice + abas.length - 1) % abas.length;
      if (evento.key === 'Home') proximo = 0;
      if (evento.key === 'End') proximo = abas.length - 1;
      if (proximo === undefined) return;
      evento.preventDefault(); trocarAba(abas[proximo].dataset.painel); abas[proximo].focus();
    });
  });

  function mostrarContratados(contratacoes) {
    const lista = document.querySelector('#lista-contratados'); lista.replaceChildren(); preencher('#total-contratados', contratacoes.length);
    document.querySelector('#contratados-vazio').hidden = contratacoes.length !== 0;
    document.querySelector('#tabela-contratados').hidden = contratacoes.length === 0;
    [...contratacoes].sort((a,b) => b.data.localeCompare(a.data)).forEach(item => {
      const linha = document.querySelector('#modelo-contratado').content.cloneNode(true);
      linha.querySelectorAll('[data-campo]').forEach(c => c.textContent = c.dataset.campo === 'data' ? HerbWay.data(item.data) : item[c.dataset.campo]);
      linha.querySelector('.status').classList.toggle('pendente', item.status !== 'Concluído');
      const botao = linha.querySelector('button'); botao.setAttribute('aria-label', 'Ver detalhes: ' + item.titulo);
      botao.addEventListener('click', () => {
        idContratacao = item.id;
        ['titulo','profissional','data','status','descricao'].forEach(c => preencher('#detalhe-' + c, c === 'data' ? HerbWay.data(item.data) : item[c]));
        document.querySelector('#concluir-contratacao').hidden = item.status === 'Concluído';
        const botaoAvaliar = document.querySelector('#avaliar-contratacao');
        botaoAvaliar.hidden = item.status !== 'Concluído';
        botaoAvaliar.textContent = item.nota ? 'Alterar avaliação' : 'Avaliar serviço';
        document.querySelector('#detalhe-avaliacao').hidden = !item.nota;
        if (item.nota) preencher('#detalhe-nota', HerbWay.estrelas(item.nota) + ' ' + HerbWay.rotulosNota[item.nota - 1]);
        const detalheComentario = document.querySelector('#detalhe-comentario');
        detalheComentario.hidden = !item.comentario;
        preencher('#detalhe-comentario', item.comentario);
        modalDetalhes.showModal();
      });
      if (item.nota) {
        const celulaStatus = linha.querySelector('[data-rotulo="Status"]');
        const marca = document.createElement('span');
        marca.className = 'nota'; marca.textContent = ' ' + HerbWay.estrelas(item.nota);
        marca.title = 'Sua avaliação: ' + item.nota + ' — ' + HerbWay.rotulosNota[item.nota - 1];
        celulaStatus.append(marca);
      }
      lista.append(linha);
    });
  }
  document.querySelector('#concluir-contratacao').addEventListener('click', async () => {
    try {
      await HerbWay.concluir(idContratacao);
      const contratacao = HerbWay.ler().contratacoes.find(c => String(c.id) === String(idContratacao));
      modalDetalhes.close();
      if (contratacao) abrirAvaliacao(contratacao); else mostrarAviso('Serviço marcado como concluído.');
    }
    catch (erro) { modalDetalhes.close(); mostrarAviso(erro.message); }
  });

  function pintarEstrelas(preview) {
    estrelas.forEach((estrela, indice) => {
      estrela.classList.toggle('ativa', indice < preview);
      estrela.setAttribute('aria-pressed', String(indice + 1 === notaSelecionada));
    });
    preencher('#rotulo-nota', preview ? preview + (preview === 1 ? ' estrela — ' : ' estrelas — ') + HerbWay.rotulosNota[preview - 1] : 'Escolha de 1 a 5 estrelas');
  }
  function abrirAvaliacao(item) {
    idContratacao = item.id;
    notaSelecionada = Number(item.nota) || 0;
    preencher('#avaliacao-servico', [item.titulo, item.profissional].filter(Boolean).join(' — '));
    document.querySelector('#comentario-avaliacao').value = item.comentario || '';
    mostrarErro('erro-avaliacao', '');
    pintarEstrelas(notaSelecionada);
    document.querySelector('#salvar-avaliacao').disabled = !notaSelecionada;
    modalAvaliacao.showModal();
  }
  estrelas.forEach(estrela => {
    const nota = Number(estrela.dataset.nota);
    estrela.addEventListener('click', () => { notaSelecionada = nota; pintarEstrelas(nota); document.querySelector('#salvar-avaliacao').disabled = false; });
    estrela.addEventListener('mouseenter', () => pintarEstrelas(nota));
    estrela.addEventListener('mouseleave', () => pintarEstrelas(notaSelecionada));
    estrela.addEventListener('focus', () => pintarEstrelas(nota));
    estrela.addEventListener('blur', () => pintarEstrelas(notaSelecionada));
  });
  document.querySelector('#avaliar-contratacao').addEventListener('click', () => {
    const contratacao = HerbWay.ler().contratacoes.find(c => String(c.id) === String(idContratacao));
    if (!contratacao) return;
    modalDetalhes.close(); abrirAvaliacao(contratacao);
  });
  document.querySelector('#salvar-avaliacao').addEventListener('click', async () => {
    const comentario = document.querySelector('#comentario-avaliacao').value.trim();
    try { await HerbWay.avaliar(idContratacao, notaSelecionada, comentario); modalAvaliacao.close(); mostrarAviso('Obrigado! Sua avaliação foi registrada.'); }
    catch (erro) { mostrarErro('erro-avaliacao', erro.message); }
  });

  function mostrarMeusServicos(servicos) {
    const lista = document.querySelector('#lista-meus'); lista.replaceChildren(); preencher('#total-meus', servicos.length);
    document.querySelector('#meus-vazio').hidden = servicos.length !== 0; document.querySelector('#tabela-meus').hidden = servicos.length === 0;
    servicos.forEach(servico => {
      const linha = document.querySelector('#modelo-meu').content.cloneNode(true);
      const campos = { ...servico, preco: servico.preco === null ? 'A combinar' : Number(servico.preco).toLocaleString('pt-BR', {style:'currency', currency:'BRL'}), status: servico.ativo ? 'Publicado' : 'Pausado' };
      linha.querySelectorAll('[data-campo]').forEach(c => c.textContent = campos[c.dataset.campo]);
      linha.querySelector('.status').classList.toggle('pausado', !servico.ativo);
      const botao = linha.querySelector('button'); botao.setAttribute('aria-label', 'Editar serviço: ' + servico.titulo); botao.addEventListener('click', () => abrirServico(servico.id));
      lista.append(linha);
    });
  }

  function atualizarBotaoServico() { preencher('#salvar-servico', idEdicao ? 'Salvar alterações' : (formServico.elements.ativo.checked ? 'Publicar serviço' : 'Salvar como pausado')); }
  function prepararServico(id = null) {
    const perfil = HerbWay.conta(); if (!perfil) return false;
    const servico = id ? HerbWay.ler().servicos.find(s => String(s.id) === String(id) && String(s.usuarioId) === String(perfil.id)) : null;
    if (id && !servico) { mostrarAviso('Este serviço não está disponível para edição.'); return false; }
    idEdicao = id; formServico.reset(); formServico.querySelectorAll('input, textarea').forEach(c => c.setCustomValidity(''));
    preencher('#titulo-servico', id ? 'Editar serviço' : 'Postar um serviço');
    preencher('#ajuda-servico', id ? 'Atualize as informações do seu anúncio.' : 'Conte o que você faz e encontre pessoas que precisam do seu cuidado.');
    document.querySelector('#excluir-servico').hidden = !id;
    formServico.elements.cidade.value = perfil.cidade || ''; formServico.elements.estado.value = perfil.estado || '';
    if (servico) { ['titulo','categoria','preco','cidade','estado','descricao'].forEach(c => formServico.elements[c].value = servico[c] ?? ''); formServico.elements.ativo.checked = Boolean(servico.ativo); }
    atualizarBotaoServico(); mostrarErro('erro-servico', ''); return true;
  }
  function abrirServico(id = null) { if (!prepararServico(id)) return; trocarAba('postar'); document.querySelector('#aba-postar').focus(); }
  document.querySelectorAll('[data-novo-servico]').forEach(b => b.addEventListener('click', () => abrirServico()));
  formServico.elements.ativo.addEventListener('change', atualizarBotaoServico);
  document.querySelector('#cancelar-servico').addEventListener('click', () => { prepararServico(); trocarAba('meus'); document.querySelector('#aba-meus').focus(); });
  formServico.addEventListener('submit', async evento => {
    evento.preventDefault(); if (!validarFormulario(formServico)) return;
    const campos = {}; ['titulo','categoria','cidade','estado','descricao'].forEach(c => campos[c] = formServico.elements[c].value.trim());
    campos.preco = formServico.elements.preco.value === '' ? null : Number(formServico.elements.preco.value); campos.ativo = formServico.elements.ativo.checked;
    try { await HerbWay.salvarServico(campos, idEdicao); prepararServico(); trocarAba('meus'); document.querySelector('#aba-meus').focus(); mostrarAviso(campos.ativo ? 'Serviço salvo e disponível no dashboard.' : 'Serviço salvo como pausado.'); }
    catch (erro) { mostrarErro('erro-servico', erro.message); }
  });
  document.querySelector('#excluir-servico').addEventListener('click', async () => {
    if (!confirm('Excluir este anúncio? O histórico das contratações será mantido.')) return;
    try { await HerbWay.excluirServico(idEdicao); prepararServico(); trocarAba('meus'); document.querySelector('#aba-meus').focus(); mostrarAviso('Anúncio excluído.'); }
    catch (erro) { mostrarErro('erro-servico', erro.message); }
  });

  function mostrarPublicos(servicos) {
    const lista = document.querySelector('#lista-publicos'); lista.replaceChildren(); const publicados = servicos.filter(s => s.ativo);
    document.querySelector('#publicos-vazio').hidden = publicados.length !== 0;
    publicados.forEach(servico => { const card = document.querySelector('#modelo-publico').content.cloneNode(true); const campos = {...servico, preco: HerbWay.moeda(servico.preco)}; card.querySelectorAll('[data-campo]').forEach(c => c.textContent = campos[c.dataset.campo]); card.querySelector('[data-link-servico]').href = '/servicos/' + encodeURIComponent(servico.id); lista.append(card); });
  }

  async function atualizar() {
    await HerbWay.pronto;
    const dados = HerbWay.ler(), conta = HerbWay.conta();
    const perfil = dados.usuarios.find(usuario => String(usuario.id) === String(idPublico || conta?.id));
    if (!perfil) {
      document.querySelectorAll('[data-proprio]').forEach(e => e.hidden = true); document.querySelector('#card-perfil').hidden = true; document.querySelector('#servicos-publicos').hidden = true; document.querySelector('#perfil-inexistente').hidden = !idPublico; document.querySelectorAll('dialog[open]').forEach(m => m.close()); if (!idPublico) irParaLogin(); return;
    }
    document.querySelector('#perfil-inexistente').hidden = true;
    const proprio = String(perfil.id) === String(conta?.id), servicos = dados.servicos.filter(s => String(s.usuarioId) === String(perfil.id));
    mostrarPerfil(perfil, proprio, servicos); mostrarContratados(proprio ? dados.contratacoes.filter(c => String(c.usuarioId) === String(perfil.id)) : []); mostrarMeusServicos(proprio ? servicos : []); if (!proprio) mostrarPublicos(servicos);
  }
  window.addEventListener('herbway:atualizado', atualizar); window.addEventListener('pageshow', atualizar);
  await atualizar(); prepararServico();
  const parametros = new URLSearchParams(location.search); trocarAba(parametros.get('aba') || 'contratados', false); if (parametros.get('acao') === 'postar') abrirServico(); if (parametros.get('editar')) abrirServico(parametros.get('editar'));
})();