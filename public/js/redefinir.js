const form = document.querySelector('#form-acesso');
form.addEventListener('submit', async evento => {
  evento.preventDefault();
  if (!validarFormulario(form)) return;
  if (form.elements.senha.value !== form.elements.confirmar_senha.value) { mostrarErro('erro-acesso', 'As senhas não coincidem.'); return; }
  try {
    const res = await fetch('/api/redefinir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: form.elements.token.value, senha: form.elements.senha.value, confirmar_senha: form.elements.confirmar_senha.value }) });
    const corpo = await res.json();
    if (!res.ok) { mostrarErro('erro-acesso', corpo.erro); return; }
    mostrarErro('erro-acesso', '');
    mostrarAviso(corpo.mensagem);
    setTimeout(() => location.assign('/login'), 2000);
  } catch { mostrarErro('erro-acesso', 'Não foi possível redefinir a senha.'); }
});
