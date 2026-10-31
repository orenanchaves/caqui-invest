// Marca no índice a seção que está na tela.
const links = [...document.querySelectorAll('.ds-nav a')];
const marcar = (id) => links.forEach((a) => (a.getAttribute('href') === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
const olhar = new IntersectionObserver((itens) => {
  for (const item of itens) if (item.isIntersecting) marcar(item.target.id);
}, { rootMargin: '-20% 0px -70% 0px' });
document.querySelectorAll('.ds-secao').forEach((s) => olhar.observe(s));

// Copia o código do bloco e confirma no próprio botão.
document.addEventListener('click', async (e) => {
  const b = e.target.closest('.ds-copiar');
  if (!b) return;
  try {
    await navigator.clipboard.writeText(b.nextElementSibling.textContent);
    b.textContent = 'Copiado';
  } catch {
    b.textContent = 'Selecione e copie';
  }
  setTimeout(() => { b.textContent = 'Copiar'; }, 1600);
});

// Encaixa cada tela real na largura da moldura.
function encaixar() {
  document.querySelectorAll('iframe[data-largura]').forEach((f) => {
    f.style.transform = `scale(${f.parentElement.clientWidth / Number(f.dataset.largura)})`;
  });
}
encaixar();
new ResizeObserver(encaixar).observe(document.querySelector('.ds'));

// No desktop o índice fica sempre aberto; no celular, abre sob demanda e fecha ao escolher.
const indice = document.querySelector('#ds-indice');
const largo = matchMedia('(min-width: 60rem)');
const ajustar = () => { indice.open = largo.matches; };
ajustar();
largo.addEventListener('change', ajustar);
indice.addEventListener('click', (e) => { if (e.target.closest('a') && !largo.matches) indice.open = false; });

// Busca no índice: procura no nome e no conteúdo de cada item.
const busca = document.querySelector('#ds-busca');
const semItem = document.querySelector('#ds-sem-item');
const normal = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const achados = () => links.filter((a) => !a.hidden);
busca.addEventListener('input', () => {
  const termo = normal(busca.value.trim());
  links.forEach((a) => {
    const alvo = document.querySelector(a.getAttribute('href'));
    a.hidden = Boolean(termo) && !normal(`${a.textContent} ${alvo.textContent}`).includes(termo);
  });
  document.querySelectorAll('.ds-indice-grupo').forEach((g) => { g.hidden = !g.querySelector('a:not([hidden])'); });
  document.querySelectorAll('.ds-indice-grupo > span').forEach((s) => {
    let prox = s.nextElementSibling, tem = false;
    while (prox && prox.tagName === 'A') { tem ||= !prox.hidden; prox = prox.nextElementSibling; }
    s.hidden = !tem;
  });
  semItem.style.display = achados().length ? 'none' : 'block';
  indice.open = largo.matches || Boolean(termo);
});
busca.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || !achados().length) return;
  e.preventDefault();
  const termo = normal(busca.value.trim());
  (achados().find((a) => normal(a.textContent).includes(termo)) || achados()[0]).click();
});
