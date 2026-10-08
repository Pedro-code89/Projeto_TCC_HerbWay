function mostrarCatalogo(servicos) {
  const lista = document.querySelector('#lista-servicos');

  if (!lista) {
    console.error('Elemento #lista-servicos não encontrado.');
    return;
  }

  lista.replaceChildren();

  const visiveis = servicos.filter(servico => {
    return Number(servico.ativo) === 1 && servico.titulo;
});

  console.log('Serviços recebidos:', servicos);
  console.log('Serviços visíveis:', visiveis);

  visiveis.forEach(servico => {
    const card = document
      .querySelector('#modelo-anuncio')
      .content
      .cloneNode(true);

    const nome = servico.nome || servico.profissional || 'Profissional';

    const campos = {
      ...servico,

      titulo: servico.titulo || 'Serviço',
      nome: nome,

      iniciais: HerbWay.iniciais(nome),

      local: `${servico.cidade}, ${servico.estado}`,

      preco: HerbWay.moeda(servico.preco),

      avaliacao: HerbWay.avaliacao(servico)
    };

    card.querySelectorAll('[data-campo]').forEach(elemento => {
      const campo = elemento.dataset.campo;

      if (campos[campo] !== undefined) {
        elemento.textContent = campos[campo];
      }
    });

    HerbWay.aplicarAvatar(card.querySelector('.avatar-pequeno'), { nome, foto: servico.foto });

    card.querySelectorAll('[data-link="servico"]').forEach(link => {
      link.href = '/servicos/' + encodeURIComponent(servico.id);
    });

    const linkProfissional = card.querySelector(
      '[data-link="profissional"]'
    );

    if (linkProfissional) {
      linkProfissional.href =
        '/profissional/' + encodeURIComponent(servico.usuarioId);
    }

    lista.append(card);
  });

  const total = document.querySelector('#totalResultados');

  if (total) {
    total.textContent =
      `${visiveis.length} ${
        visiveis.length === 1
          ? 'serviço encontrado'
          : 'serviços encontrados'
      }`;
  }

  const semResultados = document.querySelector('#semResultados');

  if (semResultados) {
    semResultados.hidden = visiveis.length !== 0;
  }
}