const formLogin = document.querySelector('#form-acesso');
function destinoLogin() {
  const caminho = new URLSearchParams(location.search).get('voltar') || '/perfil';
  const destino = new URL(caminho, location.origin);
  return destino.origin === location.origin && /^\/(perfil|servicos|profissional)([/?]|$)/.test(destino.pathname) ? destino.pathname + destino.search : '/perfil';
}
formLogin.addEventListener('submit', async evento => {
  evento.preventDefault();
  if (!validarFormulario(formLogin)) return;
  try {
    await HerbWay.entrar(formLogin.elements.email.value, formLogin.elements.senha.value);
    formLogin.reset(); location.assign(destinoLogin());
  } catch (erro) { mostrarErro('erro-acesso', erro.message); }
});
document.querySelector('#entrar-demo')?.addEventListener('click', async () => {
  try {
    const usuario = HerbWay.ler().usuarios[0];
    await HerbWay.entrar(usuario.email, '12345678');
    location.assign(destinoLogin());
  } catch (erro) { mostrarErro('erro-acesso', erro.message); }
});
