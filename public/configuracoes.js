import { esc } from './ui.js';

const area = document.querySelector('#configuracoes');
const VISTAS = [['caixinhas', 'Caixinhas'], ['lista', 'Lista'], ['grafico', 'Gráfico']];
const ler = (chave) => { try { return localStorage.getItem(chave); } catch { return null; } };
const guardar = (chave, valor) => { try { localStorage.setItem(chave, valor); } catch {} };

// Volta para a tela de onde veio, mantendo o cliente escolhido na demonstração.
document.querySelector('#voltar').addEventListener('click', (e) => {
  if (!document.referrer.startsWith(location.origin)) return;
  e.preventDefault();
  history.back();
});
document.querySelector('#menu-extrato').href = `extrato.html${location.search}`;

const r = await fetch(`/api/extrato${location.search}`);
if (!r.ok) {
  area.innerHTML = '<p class="vazio">Não consegui abrir as configurações. <a href="/">Voltar para o app</a></p>';
} else {
  const e = await r.json();
  const vista = VISTAS.some(([id]) => id === ler('vista')) ? ler('vista') : 'caixinhas';
  area.innerHTML = `<h1>Configurações</h1>
    <ul class="lista-extrato">
      <li class="linha-extrato"><span>Nome</span><strong>${esc(e.cliente)}</strong></li>
      <li class="linha-extrato"><label for="valores">Abrir com valores ocultos</label><input class="chave" type="checkbox" role="switch" id="valores"${ler('valores') === 'ocultos' ? ' checked' : ''}></li>
      <li class="linha-extrato"><label for="vista">Forma de ver o portfólio</label><select class="vista-seletor" id="vista">${VISTAS.map(([id, rotulo]) => `<option value="${id}"${id === vista ? ' selected' : ''}>${rotulo}</option>`).join('')}</select></li>
    </ul>`;
  area.querySelector('#valores').addEventListener('change', (ev) => guardar('valores', ev.target.checked ? 'ocultos' : 'visiveis'));
  area.querySelector('#vista').addEventListener('change', (ev) => guardar('vista', ev.target.value));
}
