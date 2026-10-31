import { caixinha, cartao, esc, FILAS, ICONES, linhaDinheiro, md, setores } from './ui.js';

const $ = (s) => document.querySelector(s);
const fio = $('#fio'), home = $('#home'), campo = $('#texto'), enviar = $('#enviar');
const SUGESTOES = ['Meu resgate não caiu. Sumiu?', 'Apliquei e não aparece no extrato', 'Quando cai meu resgate?', 'O que é liquidez diária?'];
const chipsSugestoes = () => `<div class="chips">${SUGESTOES.map((t) => `<button class="chip" data-fala="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
const VISTAS = [['caixinhas', 'Caixinhas'], ['lista', 'Lista'], ['grafico', 'Gráfico']];
let vista = 'caixinhas';
try { vista = VISTAS.some(([id]) => id === localStorage.getItem('vista')) ? localStorage.getItem('vista') : vista; } catch {}
const ATALHOS = [
  ['carteira', 'Portfólio', 'Onde está meu dinheiro?'],
  ['calculadora', 'Quanto vou receber', 'Quanto vou receber se resgatar tudo hoje?'],
  ['rendimento', 'Comparar poupança', 'Meu CDB rendeu menos que a poupança?'],
  ['extrato', 'Extrato', ''],
];
const sessao = { cliente: null, agora: null, estado: {}, historico: [] };

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
  $('.orb').setAttribute('aria-expanded', aberta);
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

function ir(destino) {
  document.querySelectorAll('[data-ir]').forEach((x) => (x.dataset.ir === destino ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current')));
  if (destino === 'caquia') return conversa(true);
  conversa(false);
  if (destino === 'inicio') window.scrollTo({ top: 0, behavior: 'smooth' });
  if (destino === 'dinheiro') home.querySelector(matchMedia('(min-width: 60rem)').matches ? '.tabela-produtos' : '.carteira')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Aplicar e Resgatar orientam com o artigo da base: a demonstração não executa operações.
async function guia(rotulo) {
  conversa(true);
  adicionar(`<p>${esc(rotulo)}</p>`, 'cliente');
  const r = await fetch('/api/artigo/KB-006');
  if (!r.ok) return adicionar('<div class="aviso">Não consegui abrir a orientação agora. Tente de novo.</div>');
  const a = await r.json();
  adicionar(`<div class="corpo"><p><strong>${esc(a.titulo)}</strong></p>${md(a.corpo)}<p>Esta demonstração não faz aplicações nem resgates.</p></div>${blocoFontes([{ tipo: 'kb', id: a.id, revisado: a.revisado ?? a.revisado_em }])}`);
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
    if (res.acao === 'seguranca_imediata') { $('#pare').hidden = false; $('.pare-botao').focus(); }
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

// O rótulo acompanha o gênero do pedido: "Resgate atrasado", "Aplicação atrasada".
const SITUACOES = { andamento: ['em andamento', 'em andamento'], analise: ['em análise', 'em análise'], atrasado: ['atrasado', 'atrasada'], concluido: ['concluído', 'concluída'], recusado: ['recusado', 'recusada'] };
function rotuloSituacao(c) {
  const palavra = c.titulo.split(' ')[0];
  return `${palavra} ${SITUACOES[c.situacao][palavra.endsWith('ção') ? 1 : 0]}`;
}

// Linha da tabela de produtos no desktop: o selo mostra o pedido aberto ou o vencimento.
function linhaProduto(i) {
  const pedido = i.etapas.find((e) => e.valor);
  const fim = i.etapas.find((e) => e.rotulo === 'Vencimento');
  const selo = pedido ? `${pedido.rotulo} ${pedido.br}` : fim ? `Até ${fim.br}` : '';
  return `<tr><td class="produto-nome"><span class="linha-icone"><span class="icone-pacote" style="--icone: url(icones/extrato.svg)"></span></span>${esc(i.nome)}</td><td>${esc(i.taxa)}</td><td><span class="valor">${esc(i.valor)}</span></td><td>${selo ? `<span class="selo">${esc(selo)}</span>` : ''}</td><td><button class="linha-abrir" type="button" data-fala="Onde está meu dinheiro?" aria-label="Perguntar sobre ${esc(i.nome)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></td></tr>`;
}

async function iniciar() {
  sessao.cliente = $('#cliente').value;
  sessao.agora = $('#hora').value;
  $('#menu-extrato').href = `extrato.html?cliente=${encodeURIComponent(sessao.cliente)}&agora=${encodeURIComponent(sessao.agora)}`;
  try { sessionStorage.setItem('demo-escolha', JSON.stringify([sessao.cliente, sessao.agora])); } catch {}
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
  let ocultos = false;
  try { ocultos = localStorage.getItem('valores') === 'ocultos'; } catch {}
  home.classList.toggle('oculto', ocultos);
  const [aberto, ...demais] = r.pedidos;
  const primeiro = aberto || r.recentes[0];
  const vistas = r.investimentos.length ? `<div data-painel="caixinhas"><div class="quadros">${r.investimentos.map(caixinha).join('')}</div></div>
      <div data-painel="lista">${r.investimentos.map(linhaDinheiro).join('')}</div>
      <div data-painel="grafico">${setores(r.setores)}</div>` : '';
  home.innerHTML = `<div class="barra-topo"><div class="barra-dentro">
      <form class="busca-topo" id="busca-topo" role="search"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg><input id="busca" type="search" placeholder="Buscar na ajuda da Caqui" aria-label="Buscar na ajuda da Caqui" autocomplete="off"></form>
      <nav class="menu-topo" aria-label="Menu principal"><button type="button" data-ir="inicio" aria-current="page">Início</button><button type="button" data-ir="dinheiro">Portfólio</button><a href="extrato.html?cliente=${encodeURIComponent(sessao.cliente)}&agora=${encodeURIComponent(sessao.agora)}">Extrato</a><button class="orb-topo" type="button" data-ir="caquia"><span class="orb-disco">${SIMBOLO}</span>caquIA</button></nav>
      <span class="barra-nome">${esc(r.cliente.nome)}</span><a class="avatar" href="configuracoes.html?cliente=${encodeURIComponent(sessao.cliente)}&agora=${encodeURIComponent(sessao.agora)}" aria-label="Abrir configurações">${ICONES.pessoa}</a><button class="icone" data-valores aria-pressed="${ocultos}" aria-label="${ocultos ? 'Mostrar valores' : 'Ocultar valores'}">${ICONES.olho}</button>
    </div></div>
    <div class="home-topo"><div class="home-dentro">
      <div class="home-linha"><a class="avatar" href="configuracoes.html?cliente=${encodeURIComponent(sessao.cliente)}&agora=${encodeURIComponent(sessao.agora)}" aria-label="Abrir configurações">${ICONES.pessoa}</a><h1 class="home-ola">${esc(r.cliente.nome)}</h1><button class="icone" data-valores aria-pressed="${ocultos}" aria-label="${ocultos ? 'Mostrar valores' : 'Ocultar valores'}">${ICONES.olho}</button></div>
      <p class="topo-rotulo">Seu dinheiro na Caqui</p>
      <p class="topo-total"><span class="valor">${esc(r.total)}</span></p>
      <div class="modelo-acoes"><button class="botao-contorno" data-guia="Aplicar"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>Aplicar</button><button class="botao-contorno" data-guia="Resgatar"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>Resgatar</button></div>
    </div></div>
    ${primeiro ? `<div class="destaque" data-situacao="${esc(primeiro.situacao)}"><div class="destaque-topo"><strong>${esc(rotuloSituacao(primeiro))}</strong><button class="destaque-fechar" data-fechar-destaque aria-label="Fechar aviso"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>${cartao(primeiro)}</div>` : ''}
    <div class="home-dentro home-corpo">
      <div class="painel-desktop">
        <div class="painel-principal">
          <div class="saldo-card"><div><p class="topo-rotulo">Seu dinheiro na Caqui</p><p class="topo-total"><span class="valor">${esc(r.total)}</span></p></div><div class="modelo-acoes"><button class="botao-contorno" data-guia="Aplicar"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>Aplicar</button><button class="botao-contorno" data-guia="Resgatar"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>Resgatar</button></div></div>
          <a class="conta-linha" href="extrato.html?cliente=${encodeURIComponent(sessao.cliente)}&agora=${encodeURIComponent(sessao.agora)}"><span class="linha-icone"><span class="icone-pacote" style="--icone: url(icones/carteira.svg)"></span></span><span class="conta-texto"><b>Disponível na conta</b><small>Pronto para sacar ou aplicar</small></span><span class="valor">${esc(r.conta)}</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a>
          ${r.investimentos.length ? `<div class="tabela-produtos"><table><thead><tr><th>Produto</th><th>Taxa</th><th>Saldo bruto</th><th>Status</th><th><span class="so-leitor">Abrir</span></th></tr></thead><tbody>${r.investimentos.map(linhaProduto).join('')}</tbody></table></div>` : ''}
          <button class="novo-produto" type="button" data-guia="Aplicar"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Aplicar em um novo produto</button>
        </div>
        <aside class="painel-lateral" aria-label="Informações">
          ${r.poupanca ? `<article class="lateral-card"><h3><span class="icone-pacote" style="--icone: url(icones/rendimento.svg)"></span>Contra a poupança</h3><p class="lateral-valor"><span class="valor">${esc(r.poupanca.sinal)} ${esc(r.poupanca.diferenca)}</span></p><p class="notas">No ${esc(r.poupanca.produto)}, já líquido, no mesmo período. Valores líquidos com as taxas da Caqui. KB-012</p></article>` : ''}
          <article class="lateral-card"><h3><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7.5 2.8v5.4c0 4.6-3 8-7.5 9.8-4.5-1.8-7.5-5.2-7.5-9.8V5.8L12 3Z"/></svg>Garantia do FGC</h3><p class="notas">CDB, LCI e LCA contam com o FGC, dentro dos limites por CPF e por instituição emissora. KB-013</p></article>
          <article class="lateral-card"><h3><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7.5 2.8v5.4c0 4.6-3 8-7.5 9.8-4.5-1.8-7.5-5.2-7.5-9.8V5.8L12 3Z"/></svg>Nunca pedimos código</h3><p class="notas">A Caqui não liga nem manda mensagem pedindo senha, código ou transferência. KB-019</p></article>
        </aside>
      </div>
            <div class="carteira" data-vista="${vista}"><div class="carteira-titulo"><h2 class="caixinhas-titulo">Onde está meu dinheiro</h2>${r.investimentos.length ? `<select class="vista-seletor" id="vista" aria-label="Forma de ver">${VISTAS.map(([id, rotulo]) => `<option value="${id}"${id === vista ? ' selected' : ''}>${rotulo}</option>`).join('')}</select>` : ''}</div>${vistas}<p class="carteira-total"><span>Total investido, antes do imposto</span><span class="valor">${esc(r.carteira)}</span></p><p class="carteira-total"><span>Disponível na conta</span><span class="valor">${esc(r.conta)}</span></p><span class="notas">Fonte: posições da sua conta em ${esc(r.data)}</span></div>
      <div class="atalhos">${atalhos}</div>
      <div class="perguntas"><h2 class="caixinhas-titulo">Dúvidas comuns</h2>${chipsSugestoes()}</div>
      ${demais.map(cartao).join('')}
    </div>
    <footer class="rodape-home"><div class="rodape-dentro"><button type="button" data-fala="Acho que é golpe" data-importante><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7.5 2.8v5.4c0 4.6-3 8-7.5 9.8-4.5-1.8-7.5-5.2-7.5-9.8V5.8L12 3Z"/></svg>Suspeita de golpe</button><span>${esc($('#horario').textContent)}</span></div></footer>`;
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.classList.contains('chip') && b.dataset.fala) b.classList.add('escolhido');
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
  if ('fecharDestaque' in b.dataset) b.closest('.destaque').remove();
  if (b.dataset.ir) ir(b.dataset.ir);
  if (b.dataset.pare) {
    $('#pare').hidden = true;
    if (b.dataset.pare === 'voltar') conversa(false);
  }
  if (b.dataset.guia) guia(b.dataset.guia);
  if ('abrir' in b.dataset) conversa(true);
  if ('fechar' in b.dataset) conversa(false);
  if ('valores' in b.dataset) {
    const oculto = home.classList.toggle('oculto');
    b.setAttribute('aria-pressed', oculto);
    b.setAttribute('aria-label', oculto ? 'Mostrar valores' : 'Ocultar valores');
    try { localStorage.setItem('valores', oculto ? 'ocultos' : 'visiveis'); } catch {}
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
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'busca-topo') return;
  e.preventDefault();
  const texto = $('#busca').value.trim();
  if (!texto) return;
  $('#busca').value = '';
  conversa(true);
  falar(texto);
});
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
    campo.placeholder = 'Fale aqui';
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
try {
  const [cliente, hora] = JSON.parse(sessionStorage.getItem('demo-escolha')) || [];
  if (cliente) $('#cliente').value = cliente;
  if (hora) $('#hora').value = hora;
} catch {}
await Promise.all([iniciar(), espera(1920)]);
if (location.hash === '#dinheiro' || location.hash === '#caquia') ir(location.hash.slice(1));
const abertura = $('#carregando');
abertura.classList.add('pronto');
await espera(1700);
abertura.classList.add('fim');
setTimeout(() => abertura.remove(), 900);
