// Marca no índice a seção que está na tela.
const links = [...document.querySelectorAll('.ds-nav a')];
const marcar = (id) => links.forEach((a) => (a.getAttribute('href') === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
const olhar = new IntersectionObserver((itens) => {
  for (const item of itens) if (item.isIntersecting) marcar(item.target.id);
}, { rootMargin: '-20% 0px -70% 0px' });
document.querySelectorAll('.ds-secao').forEach((s) => olhar.observe(s));
