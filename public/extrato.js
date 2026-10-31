import { esc, molduraDesktop } from './ui.js';

const area = document.querySelector('#extrato');

// Volta para a tela de onde veio, mantendo o cliente escolhido na demonstração.
document.querySelector('#voltar').addEventListener('click', (e) => {
  if (!document.referrer.startsWith(location.origin)) return;
  e.preventDefault();
  history.back();
});
const r = await fetch(`/api/extrato${location.search}`);
if (!r.ok) {
  area.innerHTML = '<p class="vazio">Não consegui abrir o extrato. <a href="/">Voltar para o app</a></p>';
} else {
  const e = await r.json();
  molduraDesktop(e.cliente, 'extrato');
  const linhas = e.itens.map((i) => `<li class="linha-extrato"><div><h2>${esc(i.titulo)}</h2><p class="notas">${esc(i.data)}, ${esc(i.status)}</p></div><span class="dinheiro">${esc(i.valor)}</span></li>`).join('');
  area.innerHTML = `<h1>Extrato de ${esc(e.cliente)}</h1>
    <p class="saldo"><span>Disponível na conta</span> <span class="dinheiro">${esc(e.conta)}</span></p>
    ${e.itens.length ? `<ul class="lista-extrato">${linhas}</ul>` : '<p class="vazio">Nenhuma movimentação até agora.</p>'}
    <p class="notas">Fonte: operações da sua conta até ${esc(e.data)}</p>`;
}
