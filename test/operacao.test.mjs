import test from 'node:test';
import assert from 'node:assert/strict';
import { opcoesOperacao, simularOperacao } from '../src/motor.mjs';

const MANHA = '2026-11-18T10:00';
const NOITE = '2026-11-18T23:00';

test('resgate desconta o pedido em aberto e respeita a carência', () => {
  const { resgates } = opcoesOperacao('C-0001', MANHA);
  const cdb = resgates.find((r) => r.nome === 'CDB Caqui Liquidez Diária 110');
  const lci = resgates.find((r) => r.nome === 'LCI Caqui 92');
  assert.equal(cdb.disponivel, 'R$ 791,24');
  assert.equal(cdb.trava, null);
  assert.equal(lci.trava, 'Em carência até 03/01/2027');
});

test('resgate mostra imposto proporcional, líquido e data calculada', () => {
  const ref = opcoesOperacao('C-0001', MANHA).resgates[0].ref;
  const s = simularOperacao('C-0001', MANHA, { tipo: 'resgatar', ref, valor: 500 });
  assert.equal(s.imposto, 'R$ 2,18');
  assert.equal(s.liquido, 'R$ 497,82');
  assert.equal(s.previsto, '18/11/2026');
  assert.deepEqual(s.fontes, ['KB-006', 'KB-010']);
});

test('produto vencido não mostra vencimento como data futura', () => {
  const lca = opcoesOperacao('C-0028', MANHA).resgates.find((r) => r.ref === 'P-0071');
  assert.equal(lca.trava, 'Venceu em 03/03/2026. Uma pessoa confirma o resgate');
});

test('resgate depois das 16h conta do próximo dia útil', () => {
  const ref = opcoesOperacao('C-0001', NOITE).resgates[0].ref;
  assert.equal(simularOperacao('C-0001', NOITE, { tipo: 'resgatar', ref, valor: 500 }).previsto, '19/11/2026');
});

test('resgate acima do disponível, travado ou de outro cliente é recusado', () => {
  const [cdb, lci] = opcoesOperacao('C-0001', MANHA).resgates;
  assert.match(simularOperacao('C-0001', MANHA, { tipo: 'resgatar', ref: cdb.ref, valor: 800 }).erro, /R\$ 791,24/);
  assert.match(simularOperacao('C-0001', MANHA, { tipo: 'resgatar', ref: lci.ref, valor: 100 }).erro, /carência/);
  assert.ok(simularOperacao('C-0002', MANHA, { tipo: 'resgatar', ref: cdb.ref, valor: 100 }).erro);
});

test('ações não estimam imposto que a base não cobre', () => {
  const r = opcoesOperacao('C-0002', MANHA).resgates.find((x) => x.nome.startsWith('Ações'));
  const s = simularOperacao('C-0002', MANHA, { tipo: 'resgatar', ref: r.ref, valor: 100 });
  assert.equal(s.imposto, null);
  assert.equal(s.liquido, null);
});

test('aplicação respeita mínimo, saldo em conta e produto da parceria', () => {
  const marta = opcoesOperacao('C-0001', MANHA).aplicacoes;
  const rafael = opcoesOperacao('C-0002', MANHA).aplicacoes;
  assert.ok(marta.some((p) => p.ref === 'CDB-LD-110'));
  assert.ok(!rafael.some((p) => p.ref === 'CDB-LD-110'));
  assert.ok(!marta.some((p) => p.ref === 'ACOES'));
  assert.match(simularOperacao('C-0001', MANHA, { tipo: 'aplicar', ref: 'LCI-90D-92', valor: 100 }).erro, /R\$ 500,00/);
  assert.match(simularOperacao('C-0001', MANHA, { tipo: 'aplicar', ref: 'LCI-90D-92', valor: 2000 }).erro, /R\$ 1\.250,00/);
});

test('aplicação só mostra prazo que a base sustenta', () => {
  const cdb = simularOperacao('C-0001', MANHA, { tipo: 'aplicar', ref: 'CDB-LD-110', valor: 1000 });
  const tesouro = simularOperacao('C-0001', MANHA, { tipo: 'aplicar', ref: 'TESOURO-SELIC-2029', valor: 100 });
  const fundo = simularOperacao('C-0001', NOITE, { tipo: 'aplicar', ref: 'FUNDO-RF-01', valor: 100 });
  assert.equal(cdb.previsto, '18/11/2026');
  assert.equal(tesouro.previsto, '19/11/2026');
  assert.equal(fundo.previsto, null);
  assert.equal(fundo.etapas.at(-1).rotulo, 'Dia-base');
  assert.equal(fundo.etapas.at(-1).br, '19/11/2026');
});

test('valor vazio ou inválido não vira cálculo', () => {
  assert.ok(simularOperacao('C-0001', MANHA, { tipo: 'aplicar', ref: 'CDB-LD-110', valor: 0 }).erro);
  assert.ok(simularOperacao('C-0001', MANHA, { tipo: 'aplicar', ref: 'CDB-LD-110', valor: NaN }).erro);
  assert.ok(simularOperacao('C-0001', MANHA, { tipo: 'outro', ref: 'CDB-LD-110', valor: 100 }).erro);
});
