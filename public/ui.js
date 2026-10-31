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
  const passos = c.etapas.map((e) => {
    const classe = e.hoje ? 'agora' : e.feita ? 'feita' : '';
    return `<li class="${classe}"><span class="marco"></span><span>${esc(e.rotulo)}${e.hoje ? ', hoje' : ''}${e.nota ? `<span class="nota">${esc(e.nota)}</span>` : ''}</span><time>${esc(e.br)}</time></li>`;
  }).join('');
  const titulo = c.status === 'Liquidada' ? `Concluído em ${c.previsto}` : c.status === 'Recusada' ? 'Pedido recusado' : c.atrasada ? `Previsto para ${c.previsto}` : c.previsto ? `Cai em ${c.previsto}` : 'Data a confirmar';
  return `<article class="ficha${c.atrasada ? ' atrasada' : ''}">
    <h3>${esc(c.titulo)}</h3>
    <p class="quando">${esc(titulo)}</p>
    <div class="ficha-meta"><span>${esc(c.atrasada ? 'Passou da data' : c.status)}</span>${c.valor ? `<span>${esc(c.valor)}</span>` : ''}</div>
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

export const FILAS = { seguranca: 'Segurança, sem fila', prioritaria: 'Prioritária', especialista: 'Especialista em investimentos', reclamacao: 'Reclamações e encerramento', geral: 'Atendimento' };
