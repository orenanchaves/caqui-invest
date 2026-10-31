// Passa dados/perguntas_teste.jsonl pelo motor e grava respostas.jsonl para ferramentas/checar_respostas.py.
import { readFileSync, writeFileSync } from 'node:fs';
import { responder, AGORA_PADRAO } from '../src/motor.mjs';

const raiz = new URL('..', import.meta.url);
const perguntas = readFileSync(new URL('dados/perguntas_teste.jsonl', raiz), 'utf8').trim().split('\n').map((l) => JSON.parse(l));

const saida = perguntas.map((p) => {
  const agora = (p.contexto.momento || AGORA_PADRAO).slice(0, 16);
  let estado = {}, res;
  for (const texto of p.pergunta.includes(' | ') ? p.pergunta.split(' | ') : [p.pergunta]) {
    res = responder({ texto, cliente: p.contexto.id_cliente, agora, estado });
    estado = res.estado;
  }
  return { id: p.id, resposta: res.textoCompleto, acao: res.acao };
});

writeFileSync(new URL('respostas.jsonl', raiz), saida.map((l) => JSON.stringify(l)).join('\n') + '\n');
if (process.argv.includes('--ver')) for (const l of saida) console.log(`\n${l.id} [${l.acao}]\n${l.resposta}`);
