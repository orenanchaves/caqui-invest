// Mostra um slide por vez, em qualquer tela.
const slides = [...document.querySelectorAll('.slide')];
const contador = document.querySelector('#contador');
const anterior = document.querySelector('#anterior');
const proximo = document.querySelector('#proximo');
let atual = 0;

// Assinatura do logo no canto direito, menos na capa e no fechamento, que já têm o logo.
slides.filter((s) => !s.classList.contains('capa')).forEach((s) => s.insertAdjacentHTML('beforeend', '<img class="slide-assinatura" src="logo/caqui-01.svg" alt="">'));

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
// Menu de links: fecha com Esc ou ao clicar fora, e o teclado não troca de slide enquanto está em foco.
const menuLinks = document.querySelector('.deck-links');
document.addEventListener('click', (e) => { if (!menuLinks.contains(e.target)) menuLinks.open = false; });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') menuLinks.open = false;
  if (e.target.closest('.deck-links')) return;
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); ir(atual + 1); }
  if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); ir(atual - 1); }
  if (e.key === 'Home') ir(0);
  if (e.key === 'End') ir(slides.length - 1);
  if (e.key.toLowerCase() === 'f' && document.fullscreenEnabled) alternarTela();
});
// Expande a apresentação para a tela inteira.
const expandir = document.querySelector('#expandir');
const alternarTela = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
expandir.hidden = !document.fullscreenEnabled;
expandir.addEventListener('click', alternarTela);
document.addEventListener('fullscreenchange', () => {
  const cheia = !!document.fullscreenElement;
  expandir.setAttribute('aria-pressed', cheia);
  expandir.setAttribute('aria-label', cheia ? 'Sair da tela inteira' : 'Expandir a tela');
});
// O palco é sempre wide, 1440 por 810; a tela só define a escala.
function escalar() {
  document.documentElement.style.setProperty('--escala', Math.min(innerWidth / 1440, innerHeight / 810));
}
escalar();
window.addEventListener('resize', escalar);
window.addEventListener('resize', encaixar);
ir(Number(location.hash.slice(1)) - 1 || 0);

// Abertura com o logo completo, igual à do app, só ao começar do primeiro slide.
const abertura = document.querySelector('#carregando');
const espera = (ms) => new Promise((pronto) => setTimeout(pronto, ms));
if (atual > 0) abertura.remove();
else {
  await espera(900);
  abertura.classList.add('pronto');
  await espera(2000);
  abertura.classList.add('fim');
  setTimeout(() => abertura.remove(), 900);
}
