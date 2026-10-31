// No desktop mostra um slide por vez; no celular os slides seguem em rolagem.
const slides = [...document.querySelectorAll('.slide')];
const contador = document.querySelector('#contador');
const anterior = document.querySelector('#anterior');
const proximo = document.querySelector('#proximo');
let atual = 0;

function encaixar() {
  document.querySelectorAll('iframe[data-largura]').forEach((f) => {
    f.style.transform = `scale(${f.parentElement.clientWidth / Number(f.dataset.largura)})`;
  });
}

function ir(n) {
  atual = Math.min(Math.max(n, 0), slides.length - 1);
  slides.forEach((s, i) => s.classList.toggle('atual', i === atual));
  contador.textContent = `${atual + 1} de ${slides.length}`;
  anterior.disabled = atual === 0;
  proximo.disabled = atual === slides.length - 1;
  history.replaceState(null, '', `#${atual + 1}`);
  encaixar();
}

anterior.addEventListener('click', () => ir(atual - 1));
proximo.addEventListener('click', () => ir(atual + 1));
document.addEventListener('keydown', (e) => {
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); ir(atual + 1); }
  if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); ir(atual - 1); }
  if (e.key === 'Home') ir(0);
  if (e.key === 'End') ir(slides.length - 1);
});
window.addEventListener('resize', encaixar);
ir(Number(location.hash.slice(1)) - 1 || 0);
