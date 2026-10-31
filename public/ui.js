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

function caminho(c) {
  const feitas = c.etapas.filter((e) => e.feita || e.hoje).length;
  const andamento = Math.round((Math.max(feitas - 1, 0) / Math.max(c.etapas.length - 1, 1)) * 100);
  const passos = c.etapas.map((e) => {
    const classe = e.hoje ? 'agora' : e.feita ? 'feita' : '';
    return `<li class="${classe}"><span class="marco"></span><span>${esc(e.rotulo)}${e.hoje ? ', hoje' : ''}${e.nota ? `<span class="nota">${esc(e.nota)}</span>` : ''}</span><time>${esc(e.br)}</time></li>`;
  }).join('');
  const titulo = c.status === 'Liquidada' ? `Concluído em ${c.previsto}` : c.status === 'Recusada' ? 'Pedido recusado' : c.atrasada ? `Previsto para ${c.previsto}` : c.previsto ? `Cai em ${c.previsto}` : 'Data a confirmar';
  return `<article class="ficha${c.atrasada ? ' atrasada' : ''}">
    <h3>${esc(c.titulo)}</h3>
    <p class="quando">${esc(titulo)}</p>
    <div class="ficha-meta"><span>${esc(c.atrasada ? 'Passou da data' : c.status)}</span>${c.valor ? `<span>${esc(c.valor)}</span>` : ''}</div>
    <div class="andamento" role="img" aria-label="Etapa ${feitas} de ${c.etapas.length}" style="--p: ${andamento}%"><span></span></div>
    <ol class="caminho">${passos}</ol>
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
  relogio: svg(['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3.5 2']),
  calculo: svg(['M6 3.5h12v17H6z', 'M9 7.5h6', 'M9 12h.1M12 12h.1M15 12h.1M9 16h.1M12 16h.1M15 16h.1']),
  grafico: svg(['M4 20V4', 'M4 20h16', 'M8 15l4-4 3 3 5-6']),
  extrato: svg(['M6 3.5h12v17l-3-1.6-3 1.6-3-1.6-3 1.6v-17Z', 'M9 8.5h6M9 12.5h6']),
  conversa: svg(['M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5Z']),
};

export const FILAS = { seguranca: 'Segurança, sem fila', prioritaria: 'Prioritária', especialista: 'Especialista em investimentos', reclamacao: 'Reclamações e encerramento', geral: 'Atendimento' };
