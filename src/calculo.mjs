// Regras 1, 2 e 3: tudo aqui é cálculo sobre calendario e taxas. Nenhum número nasce fora deste arquivo.
import D from './dados.gen.mjs';

const dia = 86400000;
const emMs = (d) => Date.parse(d + 'T00:00:00Z');
const deMs = (ms) => new Date(ms).toISOString().slice(0, 10);

export const somaCorridos = (d, n) => deMs(emMs(d) + n * dia);
export const diasEntre = (a, b) => Math.round((emMs(b) - emMs(a)) / dia);
export const dataBR = (d) => d.split('-').reverse().join('/');
export const brl = (v) => 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function ehDiaUtil(d) {
  const c = D.calendario[d];
  if (!c) throw new Error('data fora do calendário: ' + d);
  return c.dia_util;
}
export const proximoDU = (d) => { let x = somaCorridos(d, 1); while (!ehDiaUtil(x)) x = somaCorridos(x, 1); return x; };
export const paraDU = (d) => (ehDiaUtil(d) ? d : proximoDU(d));
export function somaDU(d, n) { let x = d; for (let i = 0; i < n; i++) x = proximoDU(x); return x; }

// Motivo legível de cada dia não útil pulado entre duas datas.
export function pulados(de, ate) {
  const nomes = [];
  for (let x = somaCorridos(de, 1); x < ate; x = somaCorridos(x, 1)) {
    const c = D.calendario[x];
    if (c.feriado) nomes.push(`${dataBR(x).slice(0, 5)} é feriado`);
  }
  return nomes;
}

export function diaBase(data, hora) {
  if (!ehDiaUtil(data)) return { base: proximoDU(data), motivo: 'não é dia útil' };
  if (hora > '16:00') return { base: proximoDU(data), motivo: 'depois das 16h' };
  return { base: data, motivo: 'até as 16h de dia útil' };
}

export const produto = (codigo) => D.taxas.produtos.find((p) => p.codigo === codigo);

// Devolve as etapas do caminho do dinheiro, ou null quando o produto não tem prazo de resgate.
export function prazoResgate(codigo, data, hora) {
  const { base, motivo } = diaBase(data, hora);
  const pedido = { rotulo: 'Pedido', data };
  const etapas = (...resto) => (base === data ? [pedido, ...resto] : [pedido, { rotulo: 'Dia-base', data: base, nota: motivo }, ...resto]);
  const fim = (rotulo, d, extra) => ({ etapas: etapas(...(extra || []), { rotulo, data: d }), base, motivo, pagamento: d });
  if (['CDB-LD-100', 'CDB-LD-85', 'CDB-LD-110', 'LCI-90D-92'].includes(codigo)) return fim('Dinheiro na conta', base);
  if (codigo === 'FUNDO-RF-01') {
    const cot = somaDU(base, 1);
    return fim('Dinheiro na conta', somaDU(base, 2), [{ rotulo: 'Cotização', data: cot }]);
  }
  if (codigo === 'FUNDO-MM-01') {
    const cot = paraDU(somaCorridos(base, 30));
    return fim('Dinheiro na conta', somaDU(cot, 2), [{ rotulo: 'Cotização', data: cot, nota: '30 dias corridos' }]);
  }
  if (codigo === 'TESOURO-SELIC-2029') return fim('Dinheiro na conta', somaDU(base, 1));
  if (codigo === 'ACOES') return fim('Dinheiro na conta', somaDU(base, 2));
  return null;
}

export function aliquotaIR(dias) {
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.2;
  if (dias <= 720) return 0.175;
  return 0.15;
}
export const pct = (a) => String(+(a * 100).toFixed(1)).replace('.', ',') + '%';

const arred = (v) => Math.round(v * 100 + 1e-9) / 100;

export function liquidoPosicao(p, data) {
  const prod = produto(p.produto);
  const rendimento = arred(p.saldo_bruto_brl - p.valor_aplicado_brl);
  const dias = diasEntre(p.data_aplicacao, data);
  if (!prod.tributavel) return { dias, rendimento, aliquota: 0, ir: 0, liquidoRend: rendimento, liquido: p.saldo_bruto_brl, isento: true };
  const aliquota = aliquotaIR(dias);
  const ir = arred(rendimento * aliquota);
  return { dias, rendimento, aliquota, ir, liquidoRend: arred(rendimento - ir), liquido: arred(p.saldo_bruto_brl - ir), isento: false };
}

export function poupancaEquivalente(valor, dias) {
  return arred(valor * (Math.pow(1 + D.taxas.poupanca_am, dias / 30) - 1));
}
