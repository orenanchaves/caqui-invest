// Regra 1: compara a data calculada pelo motor com liquidacao_prevista em todos os resgates dos dados.
import D from '../src/dados.gen.mjs';
import { prazoResgate } from '../src/calculo.mjs';

let certas = 0, vazias = 0; const divergentes = [];
for (const o of D.operacoes.filter((x) => x.tipo === 'resgate' && x.status !== 'recusada')) {
  const c = prazoResgate(o.produto, o.pedido_em.slice(0, 10), o.pedido_em.slice(11, 16));
  if (!c) { divergentes.push([o.id_operacao, o.produto, 'sem prazo calculável']); continue; }
  if (!o.liquidacao_prevista) vazias++;
  else if (o.liquidacao_prevista === c.pagamento) certas++;
  else divergentes.push([o.id_operacao, o.produto, o.pedido_em.slice(0, 16), o.status, 'dados ' + o.liquidacao_prevista, 'motor ' + c.pagamento]);
}
console.log({ certas, vazias_preenchidas_pelo_motor: vazias, divergentes: divergentes.length });
for (const d of divergentes) console.log(d.join(' | '));
