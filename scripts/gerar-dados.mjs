// Empacota dados/ em src/dados.gen.mjs para o Worker. O navegador nunca recebe este arquivo.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const dados = (f) => readFileSync(join(raiz, 'dados', f), 'utf8');

function csv(texto) {
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo.replace(/\r$/, '')); linhas.push(linha); linha = []; campo = ''; }
    else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  const [cab, ...resto] = linhas;
  return resto.filter((l) => l.length === cab.length).map((l) => Object.fromEntries(cab.map((k, i) => [k, l[i]])));
}

function artigo(nome) {
  const bruto = readFileSync(join(raiz, 'dados/base_conhecimento', nome), 'utf8').replace(/\r/g, '');
  const [, cabecalho, corpo] = bruto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = Object.fromEntries(cabecalho.split('\n').map((l) => l.split(/:\s*/, 2)));
  return { id: meta.id, titulo: meta.titulo, revisado_em: meta.revisado_em, corpo: corpo.replace(/^\s*#.*\n/, '').trim() };
}

const saida = {
  clientes: JSON.parse(dados('clientes.json')),
  posicoes: csv(dados('posicoes.csv')).map((p) => ({
    ...p, valor_aplicado_brl: Number(p.valor_aplicado_brl), saldo_bruto_brl: Number(p.saldo_bruto_brl),
  })),
  operacoes: csv(dados('operacoes.csv')).map((o) => ({ ...o, valor_brl: Number(o.valor_brl) })),
  taxas: JSON.parse(dados('taxas.json')),
  calendario: Object.fromEntries(JSON.parse(dados('calendario.json')).dias.map((d) => [d.data, d])),
  artigos: Object.fromEntries(readdirSync(join(raiz, 'dados/base_conhecimento')).sort().map(artigo).map((a) => [a.id, a])),
};

writeFileSync(join(raiz, 'src/dados.gen.mjs'), `// Gerado por scripts/gerar-dados.mjs. Não editar.\nexport default ${JSON.stringify(saida)};\n`);
console.log('src/dados.gen.mjs:', saida.clientes.length, 'clientes,', saida.operacoes.length, 'operações,', Object.keys(saida.artigos).length, 'artigos');
