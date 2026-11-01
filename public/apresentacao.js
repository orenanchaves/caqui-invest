// Mostra um slide por vez, em qualquer tela.
const slides = [...document.querySelectorAll('.slide')];
const abriuDoInicio = !location.hash;
const movel = matchMedia('(max-width: 59.99rem)');
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

const secoes = [...document.querySelectorAll('[data-slide]')].map((botao) => ({ botao, inicio: slides.findIndex((s) => s.getAttribute('aria-label') === botao.dataset.slide) }));
secoes.forEach(({ botao, inicio }) => botao.addEventListener('click', () => ir(inicio)));

function ir(n) {
  const anterior = slides[atual];
  atual = Math.min(Math.max(n, 0), slides.length - 1);
  if (anterior !== slides[atual]) {
    slides.forEach((s) => s.classList.remove('saindo'));
    document.querySelector('.palco').dataset.sentido = slides.indexOf(anterior) < atual ? 'frente' : 'tras';
    anterior.classList.add('saindo');
    setTimeout(() => anterior.classList.remove('saindo'), 660);
  }
  const secao = secoes.filter((s) => s.inicio <= atual).pop();
  secoes.forEach((s) => (s === secao ? s.botao.setAttribute('aria-current', 'true') : s.botao.removeAttribute('aria-current')));
  slides.forEach((s, i) => s.classList.toggle('atual', i === atual));
  contador.textContent = `${atual + 1} de ${slides.length}`;
  document.querySelector('#rodape').dataset.tom = slides[atual].classList.contains('escuro') ? 'escuro' : 'claro';
  anterior.disabled = atual === 0;
  proximo.disabled = atual === slides.length - 1;
  history.replaceState(null, '', `#${atual + 1}`);
  if (movel.matches && (atual > 0 || !abriuDoInicio)) slides[atual].scrollIntoView({ behavior: 'smooth' });
  encaixar();
}

anterior.addEventListener('click', () => ir(atual - 1));
proximo.addEventListener('click', () => ir(atual + 1));
// Menu de links: fecha com Esc ou ao clicar fora.
const menuLinks = document.querySelector('.deck-links');
const topoDeck = document.querySelector('.deck-topo');
const botaoMenu = document.querySelector('#menu-movel');
document.addEventListener('click', (e) => {
  if (movel.matches) { if (!topoDeck.contains(e.target)) abrirMenuMovel(false); return; }
  if (!menuLinks.contains(e.target)) menuLinks.open = false;
});

// No celular o menu é hambúrguer, e cada seção rola até o slide.
function abrirMenuMovel(aberto) {
  topoDeck.classList.toggle('menu-aberto', aberto);
  menuLinks.open = aberto;
  botaoMenu.setAttribute('aria-expanded', aberto);
  botaoMenu.setAttribute('aria-label', aberto ? 'Fechar o menu' : 'Abrir o menu');
}
botaoMenu.addEventListener('click', () => abrirMenuMovel(!topoDeck.classList.contains('menu-aberto')));
secoes.forEach(({ botao }) => botao.addEventListener('click', () => { if (movel.matches) abrirMenuMovel(false); }));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') menuLinks.open = false;
  if (e.key === ' ' && e.target.closest('button, summary, a')) return;
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); ir(atual + 1); }
  if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); ir(atual - 1); }
  if (e.key === 'Home') ir(0);
  if (e.key === 'End') ir(slides.length - 1);
  if (e.key.toLowerCase() === 'm') recolherMenu(!document.body.classList.contains('topo-recolhido'));
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
  encaixar();
  if (movel.matches) return;
  const cheia = !!document.fullscreenElement;
  const barra = document.querySelector('.deck-topo').offsetHeight;
  const topo = cheia ? 0 : barra + 12;
  document.documentElement.style.setProperty('--deslocar', `${topo / 2}px`);
  document.documentElement.style.setProperty('--escala', Math.min(innerWidth / 1440, (innerHeight - topo) / 810));
}
escalar();
window.addEventListener('resize', escalar);
document.addEventListener('fullscreenchange', escalar);

// Recolhido, o menu só encolhe no lugar, e o palco não muda.
const botaoRecolher = document.querySelector('#recolher');
function recolherMenu(recolhido) {
  document.body.classList.toggle('topo-recolhido', recolhido);
  menuLinks.open = false;
  botaoRecolher.setAttribute('aria-expanded', !recolhido);
  botaoRecolher.setAttribute('aria-label', recolhido ? 'Mostrar o menu' : 'Recolher o menu');
  botaoRecolher.title = recolhido ? 'Mostrar o menu (M)' : 'Recolher o menu (M)';
  try { localStorage.setItem('menu-apresentacao', recolhido ? 'recolhido' : 'aberto'); } catch {}
}
botaoRecolher.addEventListener('click', () => recolherMenu(!document.body.classList.contains('topo-recolhido')));
try { if (localStorage.getItem('menu-apresentacao') === 'recolhido') recolherMenu(true); } catch {}
window.addEventListener('resize', encaixar);
ir(Number(location.hash.slice(1)) - 1 || 0);

// Guia do produto: cada botão aciona a função na tela real, dentro do slide.
const telaGuia = document.querySelector('#guia-tela');
const botoesGuia = [...document.querySelectorAll('[data-guia]')];
// A tela do guia fica sem barras de rolagem, para caber limpa na moldura.
telaGuia.addEventListener('load', () => {
  const estilo = telaGuia.contentDocument?.createElement('style');
  if (!estilo) return;
  estilo.textContent = 'html, body, .chat, .chat .fio { scrollbar-width: none; }';
  telaGuia.contentDocument.head.append(estilo);
});
let telaSuja = false;

async function telaPronta() {
  for (let i = 0; i < 100; i += 1) {
    const doc = telaGuia.contentDocument;
    if (doc?.querySelector('[data-ir="caquia"]') && !doc.querySelector('#carregando')) return doc;
    await new Promise((pronto) => setTimeout(pronto, 150));
  }
  return null;
}

async function telaLimpa() {
  const emUso = telaSuja || !telaGuia.contentDocument?.querySelector('[data-ir="caquia"]');
  if (emUso) telaGuia.src = '/';
  telaSuja = false;
  if (emUso) await new Promise((pronto) => telaGuia.addEventListener('load', pronto, { once: true }));
  return telaPronta();
}

function falarNaTela(doc, texto) {
  doc.querySelector('[data-ir="caquia"]').click();
  const botao = doc.createElement('button');
  botao.dataset.fala = texto;
  botao.hidden = true;
  doc.body.append(botao);
  botao.click();
  botao.remove();
}

const acoesGuia = {
  inicio: (doc) => doc.querySelector('[data-ir="inicio"]').click(),
  portfolio: (doc) => doc.querySelector('[data-ir="dinheiro"]').click(),
  caquia: (doc) => falarNaTela(doc, 'Quando cai meu resgate?'),
  pessoa: (doc) => { telaSuja = true; falarNaTela(doc, 'Quero falar com uma pessoa'); },
  golpe: (doc) => { telaSuja = true; falarNaTela(doc, 'Um rapaz ligou dizendo ser da segurança da Caqui e pediu meu código'); },
  extrato: (doc) => doc.querySelector('#menu-extrato').click(),
};

const pausa = (ms) => new Promise((pronto) => setTimeout(pronto, ms));
const molduraGuia = telaGuia.parentElement;
let guiaOcupado = false;

botoesGuia.forEach((botao) => botao.addEventListener('click', async () => {
  if (guiaOcupado) return;
  guiaOcupado = true;
  botoesGuia.forEach((b) => b.setAttribute('aria-pressed', b === botao));
  molduraGuia.classList.add('trocando');
  if (movel.matches) molduraGuia.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await pausa(260);
  const doc = await telaLimpa();
  if (doc) {
    const carregou = botao.dataset.guia === 'extrato' ? new Promise((pronto) => telaGuia.addEventListener('load', pronto, { once: true })) : null;
    acoesGuia[botao.dataset.guia](doc);
    await carregou;
    await pausa(420);
  }
  molduraGuia.classList.remove('trocando');
  guiaOcupado = false;
}));

// A amostra da abertura repete enquanto o slide está na tela.
const logoAnimado = document.querySelector('[data-anima-logo]');
setInterval(() => logoAnimado.classList.toggle('pronto'), 2600);

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
