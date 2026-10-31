import { caixinha, cartao, esc, FILAS, ICONES, linhaDinheiro, md, setores } from './ui.js';

const $ = (s) => document.querySelector(s);
const fio = $('#fio'), home = $('#home'), campo = $('#texto'), enviar = $('#enviar');
const SUGESTOES = ['Meu resgate não caiu. Sumiu?', 'Apliquei e não aparece no extrato', 'Quando cai meu resgate?', 'O que é liquidez diária?'];
const chipsSugestoes = () => `<div class="chips">${SUGESTOES.map((t) => `<button class="chip" data-fala="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
const VISTAS = [['caixinhas', 'Caixinhas'], ['lista', 'Lista'], ['grafico', 'Gráfico']];
let vista = 'caixinhas';
try { vista = VISTAS.some(([id]) => id === localStorage.getItem('vista')) ? localStorage.getItem('vista') : vista; } catch {}
const ATALHOS = [
  ['carteira', 'Meu dinheiro', 'Onde está meu dinheiro?'],
  ['calculadora', 'Quanto vou receber', 'Quanto vou receber se resgatar tudo hoje?'],
  ['rendimento', 'Comparar poupança', 'Meu CDB rendeu menos que a poupança?'],
  ['extrato', 'Extrato', ''],
];
const sessao = { cliente: null, agora: null, estado: {}, historico: [] };

function iniciarOrb() {
  const orb = $('.orb');
  let toque = null, arrastou = false;
  const colocar = (x, y) => {
    const margem = 8;
    orb.style.left = `${Math.min(Math.max(x, margem), window.innerWidth - orb.offsetWidth - margem)}px`;
    orb.style.top = `${Math.min(Math.max(y, margem), window.innerHeight - orb.offsetHeight - margem)}px`;
    orb.style.right = 'auto';
    orb.style.bottom = 'auto';
  };
  try {
    const salvo = JSON.parse(localStorage.getItem('orb'));
    if (salvo) colocar(salvo.x, salvo.y);
  } catch {}
  orb.addEventListener('pointerdown', (e) => {
    const r = orb.getBoundingClientRect();
    toque = { dx: e.clientX - r.left, dy: e.clientY - r.top, x: e.clientX, y: e.clientY };
    arrastou = false;
    orb.setPointerCapture(e.pointerId);
  });
  orb.addEventListener('pointermove', (e) => {
    if (!toque || (!arrastou && Math.hypot(e.clientX - toque.x, e.clientY - toque.y) < 6)) return;
    arrastou = true;
    colocar(e.clientX - toque.dx, e.clientY - toque.dy);
  });
  orb.addEventListener('pointerup', () => {
    toque = null;
    if (!arrastou) return;
    const r = orb.getBoundingClientRect();
    try { localStorage.setItem('orb', JSON.stringify({ x: r.left, y: r.top })); } catch {}
  });
  orb.addEventListener('click', (e) => {
    if (!arrastou) return;
    e.stopPropagation();
    arrastou = false;
  });
  window.addEventListener('resize', () => {
    if (!orb.style.left) return;
    const r = orb.getBoundingClientRect();
    colocar(r.left, r.top);
  });
}

const SIMBOLO = $('#chat-simbolo').innerHTML;
const QUEM = { seguranca: 'Segurança Caqui' };

// O topo do chat mostra quem está com o cliente: caquIA ou a equipe.
function atendimento(entrega) {
  $('#chat').classList.toggle('humano', !!entrega);
  $('#chat').classList.toggle('seguranca', entrega?.fila === 'seguranca');
  $('#chat-nome').textContent = entrega ? QUEM[entrega.fila] || 'Equipe Caqui' : 'caquIA';
  $('#chat-simbolo').innerHTML = entrega ? ICONES.pessoa : SIMBOLO;
}

function conversa(aberta) {
  $('#chat').hidden = !aberta;
  $('[data-abrir]').hidden = aberta;
  $('[data-abrir]').setAttribute('aria-expanded', aberta);
  if (aberta) campo.focus({ preventScroll: true });
}

const rolar = () => { fio.scrollTop = fio.scrollHeight; };

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
  const nome = (f) => (f.tipo === 'kb' ? `${f.id}, revisado em ${f.revisado}` : f.rotulo);
  const itens = fontes.map((f) => (f.tipo === 'kb'
    ? `<button class="fonte" data-artigo="${esc(f.id)}">${esc(nome(f))}</button>`
    : `<span>${esc(nome(f))}</span>`)).join('');
  const resumo = `Fonte: ${esc(nome(fontes[0]))}${fontes.length > 1 ? ` e mais ${fontes.length - 1}` : ''}`;
  return `<details class="fontes"><summary>${resumo}</summary><div class="fontes-lista">${itens}</div></details>`;
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

// Sementes em looping nas ações importantes, sem atrasar a resposta do motor.
async function aguardar(tarefa) {
  const tela = $('#aguarde');
  tela.hidden = false;
  try {
    await Promise.all([tarefa(), new Promise((ok) => setTimeout(ok, 1000))]);
  } finally {
    tela.hidden = true;
  }
}

async function falar(texto) {
  texto = texto.trim();
  if (!texto) return;
  conversa(true);
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
    if (res.entrega) atendimento(res.entrega);
    sessao.historico.push({ de: 'cliente', texto }, { de: 'caqui', texto: res.textoCompleto });
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
  atendimento(null);
  adicionar(`<div class="corpo"><p>Como posso ajudar?</p></div>${chipsSugestoes()}`);
  conversa(false);
  const r = await fetch(`/api/inicio?cliente=${sessao.cliente}&agora=${sessao.agora}`).then((x) => x.json());
  document.body.classList.toggle('calmo', r.cliente.idade60);
  $('#horario').textContent = r.humano
    ? 'Pessoas das 8h às 20h, todos os dias: disponível agora.'
    : 'Pessoas das 8h às 20h: agora registramos com protocolo. Segurança a qualquer hora.';
  const atalhos = ATALHOS.map(([icone, rotulo, fala], i) => {
    const miolo = `<span class="atalho-icone"><span class="icone-pacote" style="--icone: url(icones/${icone}.svg)"></span></span><span>${esc(rotulo)}</span>`;
    if (!fala) return `<a class="atalho" href="extrato.html?cliente=${encodeURIComponent(sessao.cliente)}&agora=${encodeURIComponent(sessao.agora)}">${miolo}</a>`;
    return `<button class="atalho${i ? '' : ' principal'}" data-fala="${esc(fala)}">${miolo}</button>`;
  }).join('');
  home.classList.remove('oculto');
  const [primeiro, ...demais] = r.pedidos;
  const vistas = r.investimentos.length ? `<div data-painel="caixinhas"><div class="quadros">${r.investimentos.map(caixinha).join('')}</div></div>
      <div data-painel="lista">${r.investimentos.map(linhaDinheiro).join('')}</div>
      <div data-painel="grafico">${setores(r.setores)}</div>` : '';
  home.innerHTML = `<div class="home-topo"><div class="home-dentro">
      <div class="home-linha"><span class="avatar">${ICONES.pessoa}</span><h1 class="home-ola">${esc(r.cliente.nome)}</h1><button class="icone" data-valores aria-pressed="false" aria-label="Ocultar valores">${ICONES.olho}</button></div>
      <p class="topo-rotulo">Seu dinheiro na Caqui</p>
      <p class="topo-total"><span class="valor">${esc(r.total)}</span></p>
    </div></div>
    <div class="home-dentro home-corpo">
      ${primeiro ? `<div class="destaque">${cartao(primeiro)}</div>` : ''}
      <div class="carteira" data-vista="${vista}"><div class="carteira-titulo"><h2 class="caixinhas-titulo">Onde está meu dinheiro</h2>${r.investimentos.length ? `<select class="vista-seletor" id="vista" aria-label="Forma de ver">${VISTAS.map(([id, rotulo]) => `<option value="${id}"${id === vista ? ' selected' : ''}>${rotulo}</option>`).join('')}</select>` : ''}</div>${vistas}<p class="carteira-total"><span>Total investido, antes do imposto</span><span class="valor">${esc(r.carteira)}</span></p><p class="carteira-total"><span>Disponível na conta</span><span class="valor">${esc(r.conta)}</span></p><span class="notas">Fonte: posições da sua conta em ${esc(r.data)}</span></div>
      <div class="atalhos">${atalhos}</div>
      <div class="perguntas"><h2 class="caixinhas-titulo">Dúvidas comuns</h2>${chipsSugestoes()}</div>
      ${demais.map(cartao).join('')}
    </div>`;
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.fala) ('importante' in b.dataset ? aguardar(() => falar(b.dataset.fala)) : falar(b.dataset.fala));
  if ('caixinha' in b.dataset) {
    const aberta = b.getAttribute('aria-expanded') === 'true';
    b.closest('.quadros').querySelectorAll('[data-caixinha]').forEach((x) => {
      const esta = x === b && !aberta;
      x.setAttribute('aria-expanded', esta);
      x.nextElementSibling.inert = !esta;
      x.closest('.quadro').classList.toggle('aberta', esta);
    });
    b.closest('.quadro').scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }
  if ('demo' in b.dataset) {
    const oculta = document.body.classList.toggle('sem-demo');
    b.setAttribute('aria-expanded', !oculta);
    try { localStorage.setItem('demo', oculta ? 'oculta' : 'visivel'); } catch {}
  }
  if ('abrir' in b.dataset) conversa(true);
  if ('fechar' in b.dataset) conversa(false);
  if ('valores' in b.dataset) {
    const oculto = home.classList.toggle('oculto');
    b.setAttribute('aria-pressed', oculto);
    b.setAttribute('aria-label', oculto ? 'Mostrar valores' : 'Ocultar valores');
  }
  if ('ok' in b.dataset) {
    b.closest('.chips').innerHTML = '<span class="horario">Obrigado. Se precisar, é só escrever.</span>';
    sessao.estado.naoEntendi = 0;
  }
  if ('bloquear' in b.dataset) {
    b.disabled = true;
    await aguardar(() => Promise.resolve());
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

document.addEventListener('change', (e) => {
  if (e.target.id !== 'vista') return;
  vista = e.target.value;
  home.querySelector('.carteira').dataset.vista = vista;
  try { localStorage.setItem('vista', vista); } catch {}
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') conversa(false); });
// Fala vira texto no campo, e o cliente confere antes de enviar.
const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Reconhecimento) {
  const microfone = $('#microfone');
  let ouvindo = null;
  microfone.hidden = false;
  const parar = () => {
    ouvindo = null;
    microfone.setAttribute('aria-pressed', 'false');
    microfone.setAttribute('aria-label', 'Falar por áudio');
    campo.placeholder = 'Sua dúvida';
  };
  microfone.addEventListener('click', () => {
    if (ouvindo) return ouvindo.stop();
    ouvindo = new Reconhecimento();
    ouvindo.lang = 'pt-BR';
    ouvindo.interimResults = true;
    ouvindo.onresult = (e) => { campo.value = [...e.results].map((r) => r[0].transcript).join(' '); };
    ouvindo.onerror = (e) => {
      parar();
      if (e.error === 'not-allowed') campo.placeholder = 'Libere o microfone para falar';
    };
    ouvindo.onend = parar;
    microfone.setAttribute('aria-pressed', 'true');
    microfone.setAttribute('aria-label', 'Parar de ouvir');
    campo.placeholder = 'Ouvindo...';
    ouvindo.start();
  });
}

$('#form').addEventListener('submit', (e) => { e.preventDefault(); falar(campo.value); });
campo.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); falar(campo.value); } });
$('#cliente').addEventListener('change', iniciar);
$('#hora').addEventListener('change', iniciar);

try { document.body.classList.toggle('sem-demo', localStorage.getItem('demo') !== 'visivel'); } catch {}
$('.demo-abrir').setAttribute('aria-expanded', !document.body.classList.contains('sem-demo'));
const demo = await fetch('/api/demo').then((x) => x.json());
$('#cliente').innerHTML = demo.clientes.map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join('');
$('#hora').innerHTML = demo.horarios.map((h) => `<option value="${esc(h)}">18/11, ${h.slice(11, 13)}h</option>`).join('');
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
await Promise.all([iniciar(), espera(1920)]);
iniciarOrb();
const abertura = $('#carregando');
abertura.classList.add('pronto');
await espera(1700);
abertura.classList.add('fim');
setTimeout(() => abertura.remove(), 900);
