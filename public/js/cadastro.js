const formCadastro = document.querySelector('#form-acesso');
formCadastro.addEventListener('submit', async evento => {
  evento.preventDefault();
  if (!validarFormulario(formCadastro)) return;
  if (formCadastro.elements.senha.value !== formCadastro.elements.confirmar_senha.value) {
    mostrarErro('erro-acesso', 'As senhas não coincidem.'); return;
  }
  try {
    const resposta = await HerbWay.cadastrar(formCadastro.elements.nome.value, formCadastro.elements.email.value, formCadastro.elements.senha.value);
    formCadastro.reset(); mostrarErro('erro-acesso', '');
    mostrarAviso(resposta.mensagem || 'Cadastro realizado! Verifique seu e-mail.');
    setTimeout(() => location.assign('/login'), 2500);
  } catch (erro) { mostrarErro('erro-acesso', erro.message); }
});
