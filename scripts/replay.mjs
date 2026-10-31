// Passa a primeira mensagem das 300 conversas rotuladas pelo motor e mede contra os rótulos.
import { readFileSync } from 'node:fs';
import { responder } from '../src/motor.mjs';
import D from '../src/dados.gen.mjs';

function csv(t) { const l = []; let c = '', f = [], a = false; for (let i = 0; i < t.length; i++) { const x = t[i]; if (a) { if (x === '"' && t[i + 1] === '"') { c += '"'; i++; } else if (x === '"') a = false; else c += x; } else if (x === '"') a = true; else if (x === ',') { f.push(c); c = ''; } else if (x === '\n') { f.push(c.replace(/\r$/, '')); l.push(f); f = []; c = ''; } else c += x; } const [h, ...r] = l; return r.map((v) => Object.fromEntries(h.map((k, i) => [k, v[i]]))); }
const conv = csv(readFileSync(new URL('../dados/conversas.csv', import.meta.url), 'utf8'));

const quer = { golpe: ['seguranca_imediata'], recomendacao: ['encaminhar_especialista'], vulneravel: ['encaminhar_humano', 'protocolo', 'seguranca_imediata', 'encaminhar_especialista'], injecao: null };
const sinais = {}; const porMotivo = {}; const erros = []; const lista = process.argv.includes('--erros');

for (const c of conv) {
  const texto = c.transcricao.split(' | ')[0].replace(/^CLIENTE: /, '');
  const agora = c.inicio.slice(0, 16);
  const res = responder({ texto, cliente: c.id_cliente, agora });
  const m = (porMotivo[c.motivo] ||= { total: 0, resolvido: 0, encaminhado: 0, naoEntendeu: 0 });
  m.total++;
  if (res.motivo === 'não entendido') m.naoEntendeu++;
  else if (res.resolvida) m.resolvido++; else m.encaminhado++;
  const rot = c.sinais ? c.sinais.split(';') : [];
  for (const s of Object.keys(quer)) {
    const tem = rot.includes(s);
    const acao = quer[s];
    const pegou = s === 'injecao' ? (res.sinalInjecao || res.acao === 'recusar' || (tem && ['seguranca_imediata', 'encaminhar_especialista'].includes(res.acao))) : acao.includes(res.acao);
    const x = (sinais[s] ||= { rotuladas: 0, pegas: 0, falsosAlarmes: 0 });
    if (tem) { x.rotuladas++; if (pegou) x.pegas++; else erros.push(['perdeu ' + s, c.id_conversa, res.acao, res.motivo, texto]); }
    else if (pegou && s !== 'vulneravel') { x.falsosAlarmes++; erros.push(['falso ' + s, c.id_conversa, res.acao, res.motivo, texto]); }
  }
  if (res.motivo === 'não entendido' || (lista && !res.resolvida && !rot.length)) erros.push(['outro', c.id_conversa, res.acao, res.motivo, texto]);
}
console.log('Sinais:', sinais);
console.table(Object.fromEntries(Object.entries(porMotivo).map(([k, v]) => [k, { ...v, pctResolvido: Math.round((v.resolvido / v.total) * 100) }])));
if (lista) for (const e of erros) console.log(e.join(' | '));
