const form = document.querySelector('#form-acesso');
form.addEventListener('submit', async evento => {
  evento.preventDefault();
  if (!validarFormulario(form)) return;
  try {
    const res = await fetch('/api/recuperacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.elements.email.value }) });
    const corpo = await res.json();
    mostrarErro('erro-acesso', '');
    mostrarAviso(corpo.mensagem);
    form.reset();
  } catch { mostrarErro('erro-acesso', 'Não foi possível processar a solicitação.'); }
});
