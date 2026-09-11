document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const nome = document.getElementById('nome');
    const email = document.getElementById('email');
    const senha = document.getElementById('senha');
    const confirmarSenha = document.getElementById('confirmar_senha');
   
    email.addEventListener('input', () => {
      email.value = email.value.toLowerCase().replace(/\s/g, '');
    });
   
    form.addEventListener('submit', (e) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
   
      if (nome.value.trim().length < 3) {
        alert('Digite seu nome completo.');
        e.preventDefault();
        return;
      }
   
      if (!emailRegex.test(email.value)) {
        alert('Por favor, insira um endereço de e-mail válido.');
        e.preventDefault();
        return;
      }
   
      if (senha.value.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        e.preventDefault();
        return;
      }
   
      if (confirmarSenha.value !== senha.value) {
        alert('As senhas não coincidem.');
        e.preventDefault();
        return;
      }
    });
  });