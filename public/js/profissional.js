(async () => {
  await HerbWay.pronto;
  const id = document.body.dataset.profissional;
  const usuario = HerbWay.ler().usuarios.find(item => String(item.id) === String(id));
  if (!usuario) { document.querySelector('#perfil-inexistente').hidden = false; return; }
  document.querySelector('#perfil-publico').hidden = false;
  document.querySelector('#servicos-profissional').hidden = false;
  const campos = {
    nome: usuario.nome,
    local: [usuario.cidade, usuario.estado].filter(Boolean).join(', '),
    sobre: usuario.sobre || 'Este usuário ainda não adicionou uma descrição.',
    avaliacao: HerbWay.avaliacao(usuario)
  };
  for (const campo in campos) document.getElementById('publico-' + campo).textContent = campos[campo];
  HerbWay.aplicarAvatar(document.getElementById('publico-avatar'), usuario);
  mostrarCatalogo(HerbWay.ler().servicos.filter(servico => String(servico.usuarioId) === String(usuario.id) && servico.ativo));
  document.querySelector('#semResultados').textContent = 'Este perfil ainda não tem serviços publicados.';
})();