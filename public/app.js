import { cartao, esc, FILAS, md } from './ui.js';

const $ = (s) => document.querySelector(s);
const fio = $('#fio'), campo = $('#texto'), enviar = $('#enviar');
const sessao = { cliente: null, agora: null, estado: {}, historico: [] };

const rolar = () => window.scrollTo({ top: document.documentElement.scrollHeight });

function adicionar(html, classe = '') {
  const el = document.createElement('div');
  el.className = `bolha ${classe}`;
  el.innerHTML = html;
  fio.append(el);
  rolar();
  return el;
}

function blocoFontes(fontes) {
  if (!fontes?.length) return '';
  const itens = fontes.map((f) => (f.tipo === 'kb'
    ? `<button class="fonte" data-artigo="${esc(f.id)}">${esc(f.id)}, revisado em ${esc(f.revisado)}</button>`
    : `<span>${esc(f.rotulo)}</span>`)).join('');
  return `<div class="fontes"><span>Fonte:</span>${itens}</div>`;
}

function blocoEntrega(e) {
  if (!e) return '';
  const linhas = [['Protocolo', e.protocolo], ['Com quem fica', FILAS[e.fila]]];
  if (e.espera > 0) linhas.push(['Espera, valor simulado', `${e.espera} min`]);
  if (e.retorno) linhas.push(['Retorno a partir de', `8h de ${e.retorno.split('-').reverse().join('/')}`]);
  const tabela = linhas.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('');
  return `<article class="ficha"><h3>Seu caso está registrado</h3><table class="tabela">${tabela}</table>
    <a href="/atendente.html#${esc(e.protocolo)}" target="_blank" rel="noopener">Ver como a equipe recebe este caso</a></article>`;
}

function blocoGolpe(res) {
  if (res.acao !== 'seguranca_imediata') return '';
  return `<div class="aviso"><strong>Segurança da Caqui acionada, sem fila</strong><button class="botao-forte" data-bloquear>Bloquear acesso agora</button></div>`;
}

function mostrar(res) {
  const chips = (res.sugestoes || []).map((s) => `<button class="chip" data-fala="${esc(s)}">${esc(s)}</button>`);
  if (res.resolvida) chips.push('<button class="chip" data-ok>Resolveu</button>', '<button class="chip" data-fala="Não resolveu">Não resolveu</button>');
  adicionar(`${blocoGolpe(res)}<div class="corpo">${md(res.texto)}</div>
    ${(res.cartoes || []).map(cartao).join('')}${blocoEntrega(res.entrega)}${blocoFontes(res.fontes)}
    ${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}`);
}

async function falar(texto) {
  texto = texto.trim();
  if (!texto) return;
  adicionar(`<p>${esc(texto)}</p>`, 'cliente');
  campo.value = '';
  enviar.disabled = true;
  try {
    const r = await fetch('/api/mensagem', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cliente: sessao.cliente, agora: sessao.agora, estado: sessao.estado, historico: sessao.historico, texto }),
    });
    if (!r.ok) throw new Error(r.status);
    const res = await r.json();
    sessao.estado = res.estado;
    sessao.historico.push({ de: 'cliente', texto }, { de: 'cadê', texto: res.textoCompleto });
    mostrar(res);
  } catch {
    adicionar('<div class="aviso">Não consegui responder agora. Sua mensagem não foi perdida: tente de novo ou ligue para a Caqui.</div>');
  } finally {
    enviar.disabled = false;
    campo.focus({ preventScroll: true });
  }
}

async function iniciar() {
  sessao.cliente = $('#cliente').value;
  sessao.agora = $('#hora').value;
  sessao.estado = {};
  sessao.historico = [];
  fio.innerHTML = '';
  const r = await fetch(`/api/inicio?cliente=${sessao.cliente}&agora=${sessao.agora}`).then((x) => x.json());
  document.body.classList.toggle('calmo', r.cliente.idade60);
  $('#horario').textContent = r.humano
    ? 'Pessoas das 8h às 20h, todos os dias: disponível agora.'
    : 'Pessoas das 8h às 20h: agora registramos com protocolo. Segurança a qualquer hora.';
  const pedidos = r.pedidos.map(cartao).join('');
  adicionar(`<h1 class="saudacao">${r.pedidos.length ? `${esc(r.cliente.nome)}, seu dinheiro está a caminho.` : `${esc(r.cliente.nome)}, nada em andamento.`}</h1>
    <p class="conta-linha">${esc(r.conta)} disponíveis na sua conta Caqui.</p>${pedidos}
    <div class="chips"><button class="chip" data-fala="Cadê meu dinheiro?">Cadê meu dinheiro?</button><button class="chip" data-fala="Quanto vou receber se resgatar tudo hoje?">Quanto vou receber?</button><button class="chip" data-fala="Meu CDB rendeu menos que a poupança?">Rendeu menos que a poupança?</button></div>`);
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.fala) falar(b.dataset.fala);
  if ('ok' in b.dataset) {
    b.closest('.chips').innerHTML = '<span class="horario">Obrigado. Se precisar, é só escrever.</span>';
    sessao.estado.naoEntendi = 0;
  }
  if ('bloquear' in b.dataset) {
    b.disabled = true;
    b.textContent = 'Acesso bloqueado, simulação';
    adicionar('<div class="corpo"><p>Sessão encerrada em todos os aparelhos (simulação). A equipe de segurança continua com você.</p></div>');
  }
  if (b.dataset.artigo) {
    const onde = b.closest('.bolha');
    const aberto = onde.querySelector(`[data-de="${b.dataset.artigo}"]`);
    if (aberto) return aberto.remove();
    const a = await fetch(`/api/artigo/${b.dataset.artigo}`).then((x) => x.json());
    b.closest('.fontes').insertAdjacentHTML('afterend', `<div class="artigo" data-de="${esc(a.id)}"><p><strong>${esc(a.titulo)}</strong></p>${md(a.corpo)}</div>`);
  }
});

$('#form').addEventListener('submit', (e) => { e.preventDefault(); falar(campo.value); });
campo.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); falar(campo.value); } });
$('#cliente').addEventListener('change', iniciar);
$('#hora').addEventListener('change', iniciar);

const demo = await fetch('/api/demo').then((x) => x.json());
$('#cliente').innerHTML = demo.clientes.map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join('');
$('#hora').innerHTML = demo.horarios.map((h) => `<option value="${esc(h)}">18/11, ${h.slice(11, 13)}h</option>`).join('');
iniciar();
