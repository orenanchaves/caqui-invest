// Teste cego: test/cego.jsonl foi escrito por um agente que não viu o código.
import { readFileSync } from 'node:fs';
import { responder } from '../src/motor.mjs';

const casos = readFileSync(new URL('../test/' + (process.argv[2] || 'cego.jsonl'), import.meta.url), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
let certos = 0; const porRegra = {}; const erros = [];
for (const c of casos) {
  const res = responder({ texto: c.texto, cliente: c.cliente, agora: c.agora });
  const ok = res.acao === c.acao_esperada;
  (porRegra[c.regra] ||= [0, 0])[1]++;
  if (ok) { certos++; porRegra[c.regra][0]++; } else erros.push(c.id + ' r' + c.regra + ' | esperado ' + c.acao_esperada + ' | veio ' + res.acao + ' (' + res.motivo + ') | ' + c.texto);
}
console.log('Acertos: ' + certos + '/' + casos.length, JSON.stringify(porRegra));
for (const e of erros) console.log(e);
