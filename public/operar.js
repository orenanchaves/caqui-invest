import { esc, molduraDesktop, rastreio } from './ui.js';

const area = document.querySelector('#operar');
const aguarde = document.querySelector('#aguarde');
const busca = new URLSearchParams(location.search);
const sessao = `cliente=${encodeURIComponent(busca.get('cliente') ?? '')}&agora=${encodeURIComponent(busca.get('agora') ?? '')}`;
const TEXTOS = {
  aplicar: { titulo: 'Aplicar', lista: 'Onde aplicar', pedir: 'Simular aplicação', vazio: 'Nenhum produto disponível para aplicar.' },
  resgatar: { titulo: 'Resgatar', lista: 'De onde resgatar', pedir: 'Simular resgate', vazio: 'Você ainda não tem investimentos para resgatar.' },
};
const AVISO = 'Esta demonstração não faz aplicações nem resgates.';
let tipo = busca.get('tipo') === 'resgatar' ? 'resgatar' : 'aplicar';
let dados = null, simulacao = null, escolhido = null, relogio = null, ultimoPedido = 0;

// Volta para a tela de onde veio, mantendo o cliente escolhido na demonstração.
document.querySelector('#voltar').addEventListener('click', (e) => {
  if (!document.referrer.startsWith(location.origin)) return;
  e.preventDefault();
  history.back();
});

const lerValor = (texto) => Number(texto.replace(/[^\d,]/g, '').replace(',', '.'));
const fonte = (s) => `<p class="notas">Fonte: ${s.fontes.map(esc).join(', ')}</p>`;

function cartaoAplicar(p) {
  const detalhe = [p.taxa, p.liquidez, p.isento ? 'Sem imposto de renda' : ''].filter(Boolean).join('. ');
  return `<label class="opcao"><input type="radio" name="ref" value="${esc(p.ref)}"><span class="opcao-corpo"><strong>${esc(p.nome)}</strong><span class="notas">${esc(detalhe)}</span></span><span class="opcao-valor"><small>Mínimo</small><span class="dinheiro">${esc(p.minimo)}</span></span></label>`;
}

function cartaoResgatar(r) {
  const detalhe = r.trava || r.taxa;
  return `<label class="opcao"><input type="radio" name="ref" value="${esc(r.ref)}"${r.trava ? ' disabled' : ''}><span class="opcao-corpo"><strong>${esc(r.nome)}</strong>${detalhe ? `<span class="notas">${esc(detalhe)}</span>` : ''}</span><span class="opcao-valor"><small>${r.trava ? 'Saldo' : 'Disponível'}</small><span class="dinheiro">${esc(r.trava ? r.bruto : r.disponivel)}</span></span></label>`;
}

function resumo() {
  const lugar = document.querySelector('#resumo');
  if (!simulacao) {
    lugar.innerHTML = `<h2>Simulação</h2><p class="notas">Escolha ${tipo === 'aplicar' ? 'o produto' : 'o investimento'} e informe o valor para ver prazo${tipo === 'aplicar' ? '' : ' e imposto'}.</p>`;
    return;
  }
  if (simulacao.erro) {
    lugar.innerHTML = `<h2>Simulação</h2><p class="operar-erro">${esc(simulacao.erro)}</p>`;
    return;
  }
  const s = simulacao;
  const data = s.previsto
    ? `<p class="quando">${s.tipo === 'aplicar' ? 'Liquidaria em' : 'Cairia em'} ${esc(s.previsto)}</p>`
    : `<p class="quando">Contaria a partir de ${esc(s.etapas.at(-1).br)}</p>`;
  const imposto = s.tipo === 'aplicar' ? '' : s.imposto === null
    ? '<p class="notas">A base não cobre o imposto deste produto. Uma pessoa pode confirmar.</p>'
    : `<div class="operar-linha"><span>Imposto estimado</span><span class="dinheiro">${s.isento ? 'Isento' : esc(s.imposto)}</span></div><div class="operar-linha forte"><span>Líquido estimado</span><span class="dinheiro">${esc(s.liquido)}</span></div>`;
  lugar.innerHTML = `<h2>Simulação</h2>${data}
    <div class="operar-linhas"><div class="operar-linha"><span>${esc(s.nome)}</span><span class="dinheiro">${esc(s.valor)}</span></div>${imposto}</div>
    ${s.tipo === 'resgatar' && s.imposto !== null && !s.isento ? '<p class="notas">Estimativa com a alíquota de hoje, proporcional ao valor.</p>' : ''}${rastreio(s.etapas)}${fonte(s)}
    <button class="primario" type="button" data-simular>${esc(TEXTOS[tipo].pedir)}</button>`;
}

async function simular() {
  const valor = lerValor(document.querySelector('#valor').value);
  const pedido = ++ultimoPedido;
  if (!escolhido || !valor) {
    simulacao = null;
    return resumo();
  }
  const r = await fetch(`/api/simular?${sessao}&tipo=${tipo}&ref=${encodeURIComponent(escolhido)}&valor=${valor}`).catch(() => null);
  if (pedido !== ultimoPedido) return;
  simulacao = r?.ok ? await r.json() : { erro: 'Não consegui calcular agora. Tente de novo.' };
  resumo();
}

function desenhar() {
  const textos = TEXTOS[tipo];
  const itens = tipo === 'aplicar' ? dados.aplicacoes : dados.resgates;
  escolhido = null;
  simulacao = null;
  document.title = `${textos.titulo}, Caqui Invest`;
  area.innerHTML = `<div class="operar-cabeca"><h1>${esc(textos.titulo)}</h1><a class="base-pessoa" href="/?q=Falar%20com%20uma%20pessoa">Falar com uma pessoa</a></div>
    <p class="notas">${AVISO}</p>
    <div class="operar-abas" role="group" aria-label="Tipo de operação"><button type="button" data-tipo="aplicar" aria-pressed="${tipo === 'aplicar'}">Aplicar</button><button type="button" data-tipo="resgatar" aria-pressed="${tipo === 'resgatar'}">Resgatar</button></div>
    <p class="saldo"><span>Disponível na conta</span> <span class="dinheiro">${esc(dados.conta)}</span></p>
    ${itens.length ? `<div class="operar-grade">
      <form class="operar-form" id="operar-form" novalidate>
        <fieldset class="operar-opcoes"><legend>${esc(textos.lista)}</legend>${itens.map(tipo === 'aplicar' ? cartaoAplicar : cartaoResgatar).join('')}<p class="notas">Fonte: ${dados.fontes[tipo].map(esc).join(', ')} e taxas da Caqui</p></fieldset>
        <div class="operar-valor"><label for="valor">Valor</label><div class="operar-campo"><span>R$</span><input id="valor" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00">${tipo === 'resgatar' ? '<button class="chip" type="button" data-tudo hidden>Tudo</button>' : ''}</div></div>
      </form>
      <aside class="operar-resumo" id="resumo" aria-live="polite" aria-label="Simulação"></aside>
    </div>` : `<p class="vazio">${esc(textos.vazio)}</p>`}`;
  if (itens.length) resumo();
}

async function concluir() {
  const s = simulacao;
  aguarde.hidden = false;
  await new Promise((pronto) => setTimeout(pronto, 1000));
  aguarde.hidden = true;
  area.innerHTML = `<div class="operar-feito"><h1>Simulação concluída</h1>
    <p>Nenhum dinheiro foi movimentado. ${AVISO}</p>
    <article class="ficha"><h3>${esc(s.nome)}</h3><p class="quando">${s.previsto ? `${s.tipo === 'aplicar' ? 'Liquidaria em' : 'Cairia em'} ${esc(s.previsto)}` : `Contaria a partir de ${esc(s.etapas.at(-1).br)}`}</p><div class="ficha-meta"><span>${s.tipo === 'aplicar' ? 'Aplicação' : 'Resgate'}</span><span class="dinheiro">${esc(s.valor)}</span></div>${rastreio(s.etapas)}</article>
    <div class="operar-fim"><a class="primario" href="/">Voltar para o início</a><button class="chip" type="button" data-tipo="${tipo}">Fazer outra simulação</button><a class="base-pessoa" href="/?q=Falar%20com%20uma%20pessoa">Falar com uma pessoa</a></div></div>`;
}

area.addEventListener('change', (e) => {
  if (e.target.name !== 'ref') return;
  escolhido = e.target.value;
  const r = tipo === 'resgatar' ? dados.resgates.find((x) => x.ref === escolhido) : null;
  const tudo = document.querySelector('[data-tudo]');
  if (tudo) {
    tudo.hidden = !r;
    tudo.dataset.limite = r?.limite ?? '';
  }
  simular();
});
area.addEventListener('input', (e) => {
  if (e.target.id !== 'valor') return;
  clearTimeout(relogio);
  relogio = setTimeout(simular, 250);
});
area.addEventListener('submit', (e) => e.preventDefault());
area.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.tipo) {
    tipo = b.dataset.tipo;
    busca.set('tipo', tipo);
    history.replaceState(null, '', `?${busca}`);
    desenhar();
  }
  if ('tudo' in b.dataset) {
    document.querySelector('#valor').value = Number(b.dataset.limite).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    simular();
  }
  if ('simular' in b.dataset) concluir();
});

const r = await fetch(`/api/operacoes?${sessao}`).catch(() => null);
if (!r?.ok) {
  area.innerHTML = '<p class="vazio">Não consegui abrir esta tela. <a href="/">Voltar para o app</a></p>';
} else {
  dados = await r.json();
  document.querySelector('#menu-extrato').search = location.search;
  molduraDesktop(dados.cliente, 'operar');
  desenhar();
}
