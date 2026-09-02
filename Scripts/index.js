document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const email = document.getElementById('email');
    const senha = document.getElementById('senha');
   
    email.addEventListener('input', () => {
      email.value = email.value.toLowerCase().replace(/\s/g, '');
    });
   
    form.addEventListener('submit', (e) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
   
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
    });
  });