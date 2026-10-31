// Desenho compartilhado entre a conversa e o painel. Todo texto passa por esc: mensagem de cliente é dado.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '$1');

export function md(texto) {
  return texto.split(/\n{2,}/).map((bloco) => {
    const linhas = bloco.split('\n');
    if (linhas.every((l) => l.startsWith('|'))) {
      const corpo = linhas.filter((l) => !/^\|[\s:-]+\|/.test(l)).map((l) => `<tr>${l.split('|').slice(1, -1).map((c) => `<td>${inline(c.trim())}</td>`).join('')}</tr>`);
      return `<table>${corpo.join('')}</table>`;
    }
    if (linhas.every((l) => /^(- |\d+\. )/.test(l))) return `<ul>${linhas.map((l) => `<li>${inline(l.replace(/^(- |\d+\. )/, ''))}</li>`).join('')}</ul>`;
    return `<p>${linhas.map(inline).join('<br>')}</p>`;
  }).join('');
}

// Rastreio no formato de entrega: etapas na horizontal, com a atual em destaque.
function rastreio(etapas) {
  const curta = etapas.length > 3;
  const passos = etapas.map((e) => {
    const classe = e.agora || e.hoje ? 'agora' : e.feita ? 'feita' : '';
    const rotulo = e.rotulo + (e.hoje ? ', hoje' : '');
    return `<li class="${classe}"${classe === 'agora' ? ' aria-current="step"' : ''}><span class="marco"></span><span class="passo">${esc(rotulo)}</span>${e.valor ? `<span class="dinheiro">${esc(e.valor)}</span>` : ''}<time>${esc(curta ? e.br.replace(/\/\d{2}(\d{2})$/, '/$1') : e.br)}</time>${e.nota ? `<span class="nota">${esc(e.nota)}</span>` : ''}</li>`;
  }).join('');
  return `<ol class="rastreio">${passos}</ol>`;
}

function caminho(c) {
  const titulo = c.status === 'Liquidada' ? `Concluído em ${c.previsto}` : c.status === 'Recusada' ? 'Pedido recusado' : c.atrasada ? `Previsto para ${c.previsto}` : c.previsto ? `Cai em ${c.previsto}` : 'Data a confirmar';
  return `<article class="ficha${c.atrasada ? ' atrasada' : ''}">
    <h3>${esc(c.titulo)}</h3>
    <p class="quando">${esc(titulo)}</p>
    <div class="ficha-meta"><span>${esc(c.atrasada ? 'Passou da data' : c.status)}</span>${c.valor ? `<span class="dinheiro">${esc(c.valor)}</span>` : ''}</div>
    ${rastreio(c.etapas)}
    ${c.notas?.length ? `<p class="notas">${esc(c.notas.join(', '))}</p>` : ''}
  </article>`;
}

function posicoes(c) {
  const linhas = c.itens.map((i) => `<tr><td>${esc(i.nome)}</td><td>${esc(i.valor)}</td></tr>`).join('');
  return `<article class="ficha"><h3>Sua carteira em ${esc(c.data)}, antes do imposto</h3>
    <table class="tabela">${linhas}<tr><td>Disponível na conta</td><td>${esc(c.conta)}</td></tr></table></article>`;
}

function conta(c) {
  const linhas = c.linhas.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('');
  return `<article class="ficha"><h3>${esc(c.titulo)}</h3><table class="tabela soma">${linhas}</table></article>`;
}

export function cartao(c) {
  if (c.tipo === 'caminho') return caminho(c);
  if (c.tipo === 'posicoes') return posicoes(c);
  if (c.tipo === 'conta') return conta(c);
  return '';
}

const svg = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d.map((p) => `<path d="${p}"/>`).join('')}</svg>`;

export const ICONES = {
  pessoa: svg(['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4']),
  olho: svg(['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z']),
  conversa: svg(['M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5Z']),
};

export function linhaDinheiro(i) {
  return `<article class="linha-dinheiro">
    <div class="linha-topo"><h3>${esc(i.nome)}</h3><span class="valor">${esc(i.valor)}</span></div>
    ${i.taxa ? `<p class="notas">${esc(i.taxa)}</p>` : ''}
    ${rastreio(i.etapas)}
  </article>`;
}

export function caixinha(i) {
  return `<article class="quadro">
    <button class="quadro-topo" data-caixinha aria-expanded="false">
      <span class="quadro-nome">${esc(i.nome)}</span>
      <span class="quadro-valor"><span class="valor">${esc(i.valor)}</span></span>
      ${i.taxa ? `<span class="quadro-taxa">${esc(i.taxa)}</span>` : ''}
    </button>
    <div class="quadro-abre" inert><div class="quadro-linha">
      ${rastreio(i.etapas)}
    </div></div>
  </article>`;
}

const COR_CLASSE = { CDB: 'accent', LCI: 'ciano', LCA: 'azul', TESOURO: 'ambar', FUNDO: 'rule', ACOES: 'vermelho' };

// Gráfico de setores da carteira, por classe de investimento.
export function setores(lista) {
  let acumulado = 0;
  const fatias = lista.map((s) => {
    const inicio = acumulado;
    acumulado += s.pct;
    return `var(--color-${COR_CLASSE[s.tipo]}) ${inicio}% ${acumulado}%`;
  }).join(', ');
  const legenda = lista.map((s) => `<li><span class="setor-cor" style="background: var(--color-${COR_CLASSE[s.tipo]})"></span><span>${esc(s.nome)}, ${String(s.pct).replace('.', ',')}%</span><span class="valor">${esc(s.valor)}</span></li>`).join('');
  const descricao = lista.map((s) => `${s.nome} ${String(s.pct).replace('.', ',')}%`).join(', ');
  return `<div class="setores"><div class="pizza" role="img" aria-label="${esc(descricao)}" style="background: conic-gradient(${fatias})"></div><ul class="setores-legenda">${legenda}</ul></div>`;
}

export const FILAS = { seguranca: 'Segurança, sem fila', prioritaria: 'Prioritária', especialista: 'Especialista em investimentos', reclamacao: 'Reclamações e encerramento', geral: 'Atendimento' };

// Barra e rodapé do desktop nas páginas internas, iguais aos da home.
export function molduraDesktop(nome, ativo) {
  const qs = location.search;
  const orb = document.querySelector('.menu-base .orb-disco').innerHTML;
  const atual = (id) => (id === ativo ? ' aria-current="page"' : '');
  document.querySelector('.topo').insertAdjacentHTML('afterend', `<div class="barra-topo"><div class="barra-dentro">
    <form class="busca-topo" action="/" role="search"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg><input name="q" type="search" placeholder="Buscar na ajuda da Caqui" aria-label="Buscar na ajuda da Caqui" autocomplete="off"></form>
    <nav class="menu-topo" aria-label="Menu principal"><a href="/">Início</a><a href="/#dinheiro">Portfólio</a><a href="extrato.html${esc(qs)}"${atual('extrato')}>Extrato</a><a class="orb-topo" href="/#caquia"><span class="orb-disco">${orb}</span>caquIA</a></nav>
    <span class="barra-nome">${esc(nome)}</span><a class="avatar" href="configuracoes.html${esc(qs)}"${atual('configuracoes')} aria-label="Abrir configurações">${ICONES.pessoa}</a>
  </div></div>`);
  document.querySelector('main').insertAdjacentHTML('afterend', '<footer class="rodape-home"><div class="rodape-dentro"><a href="/?q=Acho%20que%20%C3%A9%20golpe">Suspeita de golpe</a><span>Pessoas das 8h às 20h, todos os dias. Segurança a qualquer hora.</span></div></footer>');
}
