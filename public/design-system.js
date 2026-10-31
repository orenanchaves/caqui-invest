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
