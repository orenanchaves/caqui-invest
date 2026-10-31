import { cartao, esc, FILAS } from './ui.js';

const lista = document.querySelector('#lista'), caso = document.querySelector('#caso');
const ORDEM = { seguranca: 0, prioritaria: 1 };
const peso = (c) => ORDEM[c.fila] ?? (c.prioridade ? 1 : 2);

async function carregarLista() {
  try {
    const casos = await fetch('/api/casos').then((r) => { if (!r.ok) throw 0; return r.json(); });
    casos.sort((a, b) => peso(a) - peso(b));
    lista.innerHTML = casos.length
      ? casos.map((c) => `<button class="item ${c.fila === 'seguranca' ? 'seguranca' : c.prioridade ? 'prioridade' : ''}" data-caso="${esc(c.protocolo)}" ${location.hash === '#' + c.protocolo ? 'aria-current="true"' : ''}>
          <span>${esc(c.cliente)}${c.prioridade ? ', prioridade' : ''}</span><small>${esc(FILAS[c.fila])}. ${esc(c.motivo)}</small><small>${esc(c.protocolo)}</small></button>`).join('')
      : '<p class="vazio">Nenhum caso na fila. Peça uma pessoa na conversa e ele aparece aqui.</p>';
  } catch {
    lista.innerHTML = '<p class="vazio">Não consegui carregar a fila. Recarregue a página.</p>';
  }
}

async function abrir(protocolo) {
  if (!protocolo) return;
  caso.innerHTML = '<div class="esqueleto"></div>';
  const r = await fetch(`/api/casos/${encodeURIComponent(protocolo)}`);
  if (!r.ok) { caso.innerHTML = '<p class="vazio">Caso não encontrado. Casos da demonstração ficam 48 horas.</p>'; return; }
  const c = await r.json();
  const f = c.ficha;
  const dados = [['Cliente', `${f.nome}, ${f.idade} anos`], ['CPF', f.cpf], ['Canal preferido', f.canal], ['Origem', f.origem], ['Regra acionada', c.regra]];
  caso.innerHTML = `<h2>${esc(c.motivo)}</h2>
    <dl class="dados"><dt>Protocolo</dt><dd>${esc(c.protocolo)}</dd><dt>Fila</dt><dd>${esc(FILAS[c.fila])}${c.prioridade ? ', prioridade' : ''}</dd>
    ${dados.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
    <div class="colunas">
      <div class="coluna"><h3 class="secao">Conversa até aqui</h3>
        ${c.historico.map((t) => `<p class="turno"><b>${t.de === 'cliente' ? 'Cliente' : 'caquIA'}:</b> ${esc(t.texto)}</p>`).join('')}</div>
      <div class="coluna"><h3 class="secao">Dados conferidos</h3>${f.cartoes.map(cartao).join('')}</div>
    </div>
    <section class="resposta" aria-label="Conversa com o cliente"><h3 class="secao">Conversa com o cliente</h3>
      <div id="turnos" class="turnos" aria-live="polite"></div>
      <form id="responder" class="responder"><label class="so-leitor" for="resposta">Resposta para o cliente</label><textarea id="resposta" rows="2" placeholder="Responder ao cliente"></textarea><button class="primario" type="submit">Enviar</button></form>
    </section>`;
  lerConversa(protocolo);
}

function desenhar(lista) {
  const area = document.querySelector('#turnos');
  if (!area) return;
  area.innerHTML = lista.length
    ? lista.map((m) => `<p class="turno ${m.de === 'equipe' ? 'minha' : ''}"><b>${m.de === 'equipe' ? 'Jonas' : 'Cliente'}:</b> ${esc(m.texto)}</p>`).join('')
    : '<p class="vazio">O cliente está aguardando a primeira resposta.</p>';
  area.scrollTop = area.scrollHeight;
}

async function lerConversa(protocolo) {
  const r = await fetch(`/api/casos/${encodeURIComponent(protocolo)}/conversa`).catch(() => null);
  if (r?.ok && location.hash.slice(1) === protocolo) desenhar(await r.json());
}

document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'responder') return;
  e.preventDefault();
  const campo = document.querySelector('#resposta');
  const texto = campo.value.trim();
  if (!texto) return;
  campo.value = '';
  const r = await fetch(`/api/casos/${encodeURIComponent(location.hash.slice(1))}/conversa`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ de: 'equipe', texto }) }).catch(() => null);
  if (r?.ok) desenhar(await r.json());
  else campo.value = texto;
  campo.focus();
});

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-caso]');
  if (b) location.hash = b.dataset.caso;
});
window.addEventListener('hashchange', () => { abrir(location.hash.slice(1)); carregarLista(); });

await carregarLista();
abrir(location.hash.slice(1));
setInterval(carregarLista, 8000);
setInterval(() => { if (location.hash.length > 1) lerConversa(location.hash.slice(1)); }, 3000);
