document.addEventListener('DOMContentLoaded', () => {
  const carrossel = document.getElementById('carrosselJardineiros');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');

  if (carrossel && btnPrev && btnNext) {
      const scrollAmount = 360;

      btnNext.addEventListener('click', () => {
          carrossel.scrollBy({
              left: scrollAmount,
              behavior: 'smooth'
          });
      });

      btnPrev.addEventListener('click', () => {
          carrossel.scrollBy({
              left: -scrollAmount,
              behavior: 'smooth'
          });
      });
  }
});