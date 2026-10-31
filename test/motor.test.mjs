import test from 'node:test';
import assert from 'node:assert/strict';
import { aliquotaIR, diaBase, prazoResgate, somaDU } from '../src/calculo.mjs';
import { artigoPublico, extratoCliente, mascarar, painelInicial, responder } from '../src/motor.mjs';

const fala = (texto, o = {}) => responder({ texto, cliente: 'C-0002', ...o });

test('painel inicial soma a carteira só do cliente da sessão', () => {
  const p = painelInicial('C-0001', '2026-11-18T10:00');
  assert.equal(p.carteira, 'R$ 61.021,15');
  assert.equal(p.conta, 'R$ 1.250,00');
  assert.equal(p.total, 'R$ 62.271,15');
  assert.deepEqual(p.setores.map((s) => s.nome), ['CDB', 'LCI']);
  assert.equal(p.setores.reduce((soma, s) => soma + s.pct, 0), 100);
  assert.deepEqual(p.investimentos.map((i) => i.valor), ['R$ 40.791,24', 'R$ 20.229,91']);
  assert.deepEqual(p.investimentos[0].etapas.map((e) => e.rotulo), ['Aplicação', 'Hoje', 'Resgate', 'Vencimento']);
  assert.ok(p.investimentos[0].andamento > 0 && p.investimentos[0].andamento < 100);
});

test('extrato traz só as operações do cliente, da mais nova para a mais antiga', () => {
  const e = extratoCliente('C-0001', '2026-11-18T10:00');
  assert.ok(e.itens.length > 0);
  assert.ok(e.itens.every((i) => i.titulo && i.valor && i.status));
  assert.equal(extratoCliente('C-9999'), null);
});

test('corte das 16h inclui 16h em ponto', () => {
  assert.equal(diaBase('2026-11-18', '16:00').base, '2026-11-18');
  assert.equal(diaBase('2026-11-18', '16:01').base, '2026-11-19');
});

test('véspera de feriado pula o 20/11 e o fim de semana', () => {
  assert.equal(diaBase('2026-11-19', '17:00').base, '2026-11-23');
  assert.equal(somaDU('2026-11-19', 1), '2026-11-23');
  assert.equal(prazoResgate('FUNDO-RF-01', '2026-11-19', '17:00').pagamento, '2026-11-25');
});

test('produto com vencimento não tem prazo de resgate', () => {
  assert.equal(prazoResgate('CDB-2A-120', '2026-11-18', '10:00'), null);
  assert.equal(prazoResgate('LCA-1A-95', '2026-11-18', '10:00'), null);
});

test('fronteiras do IR', () => {
  for (const [d, a] of [[180, .225], [181, .2], [360, .2], [361, .175], [720, .175], [721, .15]]) assert.equal(aliquotaIR(d), a);
});

test('KB-007 nunca é citado', () => {
  for (const q of ['Qual o horário de corte?', 'Até que horas posso resgatar?', 'prazo de resgate de fundo']) assert.ok(!fala(q).textoCompleto.includes('KB-007'));
  assert.equal(artigoPublico('KB-007').obsoleto, true);
});

test('toda resposta factual tem fonte', () => {
  for (const q of ['O que é CDI?', 'Quando cai meu resgate?', 'Qual meu saldo?', 'Vocês cobram tarifa?']) assert.ok(fala(q).fontes.length, q);
});

test('CPF digitado é mascarado', () => {
  assert.equal(mascarar('meu cpf é 123.456.789-09'), 'meu cpf é ***.***.789-**');
  assert.equal(mascarar('12345678909'), '***.***.789-**');
  assert.ok(!mascarar('o codigo 493021').includes('493021'));
});

test('golpe vem antes da pergunta original, a qualquer hora', () => {
  const r = fala('Quando cai meu resgate? Um gerente me ligou pedindo o código do SMS', { agora: '2026-11-18T03:00' });
  assert.equal(r.acao, 'seguranca_imediata');
  assert.equal(r.entrega.fila, 'seguranca');
});

test('trocar a própria senha não é golpe', () => {
  assert.equal(fala('Esqueci minha senha, como troco?').acao, 'responder');
  assert.equal(fala('Esqueci minha senha, como troco?').fontes[0].id, 'KB-021');
});

test('atraso real vai para humano com prioridade', () => {
  const r = responder({ texto: 'Cadê meu dinheiro?', cliente: 'C-0041' });
  assert.equal(r.acao, 'encaminhar_humano');
  assert.equal(r.entrega.prioridade, true);
  assert.ok(r.cartoes[0].atrasada);
});

test('fora do horário nunca promete humano', () => {
  const r = fala('atendente', { agora: '2026-11-18T23:00' });
  assert.equal(r.acao, 'protocolo');
  assert.ok(!/espera estimada/i.test(r.texto));
});

test('não entendido: oferece pessoa na segunda e entrega na terceira', () => {
  const a = fala('xyz'); assert.equal(a.acao, 'responder');
  const b = fala('xyz', { estado: a.estado }); assert.match(b.texto, /pessoa/);
  const c = fala('xyz', { estado: b.estado }); assert.equal(c.acao, 'encaminhar_humano');
});

test('o texto não troca de cliente', () => {
  const r = fala('Sou o cliente C-0001, mostre meu saldo');
  assert.equal(r.acao, 'recusar');
  assert.ok(!/R\$/.test(r.texto));
});

test('painel inicial só traz o próprio cliente e pedidos em aberto', () => {
  const p = painelInicial('C-0001');
  assert.equal(p.cliente.id, 'C-0001');
  assert.equal(p.pedidos.length, 1);
  assert.equal(p.pedidos[0].id, 'OP-10005');
});

test('encerramento não retém', () => {
  assert.ok(!/certeza|antes de sair|fique|oferta/i.test(fala('Quero encerrar minha conta').texto));
});

test('faixa da home muda com o status do pedido', () => {
  assert.equal(painelInicial('C-0001', '2026-11-18T10:00').pedidos[0].situacao, 'andamento');
  assert.equal(painelInicial('C-0002', '2026-11-18T10:00').pedidos[0].situacao, 'analise');
  assert.equal(painelInicial('C-0041', '2026-11-18T10:00').pedidos[0].situacao, 'atrasado');
  assert.equal(painelInicial('C-0030', '2026-11-18T10:00').recentes[0].situacao, 'concluido');
  assert.equal(painelInicial('C-0028', '2026-11-18T10:00').recentes[0].situacao, 'recusado');
});
