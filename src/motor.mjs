// O motor do atendimento. Ordem fixa: travas de segurança primeiro, cálculo depois, base citada por último.
// O id do cliente vem sempre da sessão. Texto do cliente é dado, nunca instrução (regra 11).
import D from './dados.gen.mjs';
import {
  aliquotaIR, brl, dataBR, diaBase, diasEntre, liquidoPosicao, pct, poupancaEquivalente, prazoResgate,
  produto, pulados, proximoDU, somaCorridos,
} from './calculo.mjs';

export const AGORA_PADRAO = '2026-11-18T10:00';
const OBSOLETOS = new Set(['KB-007']); // corte de 15h, superado pelo KB-006
const SEM_RESGATE = new Set(['CDB-2A-120', 'LCA-1A-95']);

const ABREV = [[/\bvcs\b/g, 'voces'], [/\bvc\b/g, 'voce'], [/\boq\b/g, 'o que'], [/\bq\b/g, 'que'], [/\bhj\b/g, 'hoje'], [/\bqdo\b/g, 'quando'], [/\bqto\b/g, 'quanto'], [/\bpq\b/g, 'porque'], [/\bn\b/g, 'nao'], [/\btd\b/g, 'tudo'], [/\btb\b|\btbm\b/g, 'tambem'], [/\bto\b/g, 'estou'], [/\bta\b/g, 'esta'], [/\bpro\b/g, 'para o'], [/\bpra\b/g, 'para'], [/\bcel\b/g, 'celular']];
export const norm = (s) => ABREV.reduce((t, [a, b]) => t.replace(a, b), s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim());

export function mascarar(s) {
  return String(s)
    .replace(/\b\d{3}[.\s]?\d{3}[.\s]?(\d{3})[-.\s]?\d{2}\b/g, '***.***.$1-**')
    .replace(/((?:senha|c[oó]digo|token)\D{0,12})\d{4,8}\b/gi, '$1[oculto]')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[e-mail oculto]');
}

// ---------- travas ----------

const G = {
  segredo: /\b(senha|codigo|token|sms)\b/,
  origem: /(ligou|ligaram|rapaz|moca|moco|mandaram|ligacao|me liga|mensagem|whats|e-?mail|gerente|seguranca da caqui|suporte|alguem|pediu|pediram|pedindo|link|posso passar)/,
  direto: /(compartilhar (a |minha )?tela|validar (o |meu )?cadastro|(celular|chip|whats\w*) (foi )?clonad|(alguem )?entrou na minha conta|nao pedi\b|ligacao em espera|guiando .{0,20}telefone|ligacao.{0,60}(resgatar|transferir|pix)|pix de teste|pix(zinho)? de \d|pixzinho|teste de r\$|validar (a |minha )?conta|liberar (meu|o) (rendimento|resgate|dinheiro)|numeros que chegaram|digitos que chegaram|(pix|transferencia|compra|saque|resgate|movimentacao|aplicacao)\b.{0,40}(que )?(eu )?nao (fiz|fui eu|reconheco|autorizei)|nao (fiz|reconheco|autorizei) .{0,30}(pix|transferencia|compra|saque|resgate)|mexeram na minha conta|entraram na minha conta|login .{0,30}(nao conheco|estranho|desconhecid)|acesso .{0,30}(nao conheco|estranho|desconhecid|nao reconheco)|abriu sozinho|suporte remoto|acesso remoto|acessar meu (celular|aparelho|computador)|anydesk|teamviewer|conta segura|golpe|fraude|clonaram|hackearam|invadiram|conta vai ser bloqueada|bloquear minha conta|coloquei minha senha|passei (o|meu|a|minha) (codigo|senha|token))/,
  appRemoto: /(instalar|baixar).*(app|aplicativo|programa).*(suporte|remoto|acess|tecnico)/,
};
export function sinalGolpe(t) {
  if (/senha padrao/.test(t)) return false;
  return G.direto.test(t) || G.appRemoto.test(t) || (G.segredo.test(t) && G.origem.test(t));
}

const INJECAO = /(ignor\w* .*(instruc|regra|politica)|esquec\w* .*(politica|regra|instruc)|modo (administrador|admin|desenvolvedor|debug)|^sistema:|sem restric|sem as regras|senha padrao|prompt|lista? (os|todos)? ?.*cpf|liste os|mostre .*cliente)/;
const RECOMENDA = /(qual (voce |vc )?(pegaria|escolheria|ficaria)|deveria (botar|deixar|colocar|por|aplicar|investir)|que percentual|em que (eu )?invisto|\b(lci|lca|cdb|fundo|tesouro|acoes)\b[^?]{0,20} ou [^?]{0,20}\b(lci|lca|cdb|fundo|tesouro|acoes)\b.*(qual|para mim|conservador)|qual (e |eh |seria )?(o |a )?melhor|melhor (botar|por|colocar|aplicar|investir|deixar)|entre .* qual|se (voce|fosse) (fosse|sua|seu)|faz sentido para mim|percentual do (meu )?patrimonio|quanto (devo|deveria)|na minha idade|colocaria|investiria|qual acao comprar|acao comprar|o que comprar|onde (eu )?(coloco|invisto|aplico|investir|deixo|ponho|aplicar|colocar)|faria no meu lugar|no meu lugar|vale (mais )?a pena|melhor (investimento|opcao|produto|aplicacao)|devo (tirar|aplicar|investir|resgatar|vender|comprar|colocar|migrar|trocar)|(me )?(diz|diga|indica|indique|recomenda|sugere|sugira) (o que|onde|qual)|o que (eu )?(faco|fazer) com|o que fazer|assessor|recomend|compensa|qual rende mais)/;
const PARENTE = '(sobrinh[oa]|filh[oa]|net[oa]|genro|nora|marido|esposa|irma|irmao|vizinh[oa]|amig[oa]|namorad[oa]|cuidador[a]?|advogad[oa]|sobrinhos|filhos)';
const PRESSAO = new RegExp(`((meu|minha) ${PARENTE}.*(mandou|manda|pediu|disse|dizendo|quer|falou|lado|aqui|insist|obrig|pression))|(pressionando|me obrigando|estao me mandando)`);
const CONFUSAO = /(nao lembro o que|nao estou entendendo|nao entendo nada|nao entendi nada|estou (meio |muito |bem |toda |todo )?perdid|confus|nao sei mexer|apertei errado|nao sei o que fiz)/;
const DINHEIRO = /(resgat|tirar|transfer|passar|dinheiro|tudo|sacar|pix|conta)/;
const RETIRADA_TOTAL = /(quero|preciso|vou|tenho que|pode|ajuda a) (tirar|resgatar|sacar|retirar).*(tudo|todos?\b|toda a|inteiro|de uma vez|\d+ mil|dinheiro vivo)/;
const CONTA_TERCEIRO = new RegExp(`para (a )?conta d[oa] (meu |minha )?${PARENTE}`);
const VENDEDOR = /(moco|moca|rapaz|vendedor|vendedora|menina|gerente) da loja|senao (perde|perco|perdia)|tinha que aplicar|ultima chance|oferta acaba/;
const HUMANO = /(atendente|\bhumano\b|falar com (uma |alguma |um )?(pessoa|alguem|gente)|quero (uma )?pessoa|passa para (alguem|uma pessoa)|nao resolveu|nao ajudou|ja expliquei|nao me entendeu|voce nao entende|repetindo a mesma)/;
const RECLAMA = /(reclama|ouvidoria|procon|insatisfeit|absurdo|pessimo)/;
const ENCERRA = /((encerr|cancel|fech)\w* (a |minha |da )?(minha )?conta|encerramento|cancela tudo|nao quero mais ser cliente|sair da caqui)/;

function outroCliente(t, cliente) {
  const ids = t.match(/\bc-?\d{4}\b/g) || [];
  if (/(de|d[oa]) outr[oa] (cliente|pessoa)/.test(t)) return true;
  if (ids.some((i) => i.replace('-', '').toUpperCase() !== cliente?.id.replace('-', ''))) return true;
  if (D.clientes.some((c) => c.id !== cliente?.id && t.includes(norm(c.nome)))) return true;
  if (/(saldo|conta|cpf|extrato|dados).{0,12}\b(d[ao]) (minha |meu )?(mae|pai|avo|esposa|marido|outr[oa]|sobrinh|filh|cliente)/.test(t)) return true;
  return /(marido|esposa|mae|pai|filh[oa]|irma|irmao) tem conta|(ve|veja|olha|consulta|mostra)\b.*quanto (ele|ela) tem/.test(t);
}

// ---------- leitura da mensagem ----------

function produtoDe(t) {
  if (/cdb.*(2 anos|120)|2 anos/.test(t)) return 'CDB-2A-120';
  if (/cdb.*110/.test(t)) return 'CDB-LD-110';
  if (/cdb.*100/.test(t)) return 'CDB-LD-100';
  if (/cdb.*85/.test(t)) return 'CDB-LD-85';
  if (/\bcdb\b/.test(t)) return 'CDB';
  if (/\blci\b/.test(t)) return 'LCI-90D-92';
  if (/\blca\b/.test(t)) return 'LCA-1A-95';
  if (/multimercado/.test(t)) return 'FUNDO-MM-01';
  if (/renda fixa|fundo rf/.test(t)) return 'FUNDO-RF-01';
  if (/\bfundo\b/.test(t)) return 'FUNDO';
  if (/tesouro/.test(t)) return 'TESOURO-SELIC-2029';
  if (/\bacoes\b|\bacao\b/.test(t)) return 'ACOES';
  return null;
}
const casa = (codigo, op) => codigo === op || (codigo === 'CDB' && op.startsWith('CDB')) || (codigo === 'FUNDO' && op.startsWith('FUNDO'));
const SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function datasDe(t, hoje) {
  const achadas = [];
  for (const m of t.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g)) {
    let ano = m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : hoje.slice(0, 4);
    let d = `${ano}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    if (!m[3] && d > hoje) d = `${+ano - 1}${d.slice(4)}`;
    achadas.push(d);
  }
  if (/\banteontem\b/.test(t)) achadas.push(somaCorridos(hoje, -2));
  else if (/\bontem\b/.test(t)) achadas.push(somaCorridos(hoje, -1));
  if (/\bhoje\b/.test(t)) achadas.push(hoje);
  if (!achadas.length) {
    const i = SEMANA.findIndex((s) => new RegExp(`\\b${s}\\b`).test(t));
    if (i >= 0) {
      const delta = (new Date(hoje + 'T00:00:00Z').getUTCDay() - i + 7) % 7;
      achadas.push(somaCorridos(hoje, -delta));
    }
  }
  return achadas;
}
function horaDe(t) {
  const m = t.match(/\b(\d{1,2})h(\d{2})?\b/) || t.match(/\b(\d{1,2}):(\d{2})\b/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2] || '00'}`;
  if (/\bnoite\b/.test(t)) return '20:00';
  if (/\bmanha\b/.test(t)) return '09:00';
  return null;
}

// ---------- montagem da resposta ----------

const kb = (...ids) => ids.map((id) => ({ tipo: 'kb', id, titulo: D.artigos[id].titulo, revisado: dataBR(D.artigos[id].revisado_em) }));
const conta = (id, rotulo) => ({ tipo: 'conta', id, rotulo });
const r = (o) => ({ acao: 'responder', fontes: [], cartoes: [], sugestoes: [], resolvida: true, ...o });

function rodape(fontes) {
  if (!fontes.length) return '';
  return '\n\nFonte: ' + fontes.map((f) => (f.tipo === 'kb' ? `${f.id}, revisado em ${f.revisado}` : f.rotulo)).join('; ') + '.';
}

export function humanoDisponivel(agora) {
  const h = agora.slice(11, 16);
  return h >= '08:00' && h < '20:00';
}
export function retorno(agora) {
  return agora.slice(11, 16) < '08:00' ? agora.slice(0, 10) : somaCorridos(agora.slice(0, 10), 1);
}
// Simulado para a demonstração: o case só dá o pico de 35 min.
export function esperaSimulada(agora) {
  const h = +agora.slice(11, 13);
  return h >= 9 && h < 11 ? 35 : 6;
}

function entregar(ctx, { fila, motivo, regra, intro, fontes = [], cartoes = [], prioridade = false }) {
  const { agora, cliente } = ctx;
  const prio = prioridade || (cliente?.idade >= 60);
  const fontesTudo = [...fontes, ...kb('KB-025')];
  const entrega = { fila, motivo, regra, prioridade: prio };
  if (!humanoDisponivel(agora)) {
    return r({
      regra, motivo, acao: 'protocolo', resolvida: false, fontes: fontesTudo, cartoes, entrega: { ...entrega, retorno: retorno(agora) },
      texto: `${intro ? intro + '\n\n' : ''}O atendimento por pessoa funciona das 8h às 20h e agora não há ninguém disponível. Registrei tudo em um protocolo e o retorno começa às 8h de ${dataBR(retorno(agora))}. Você não vai precisar repetir nada.`,
    });
  }
  const espera = prio ? Math.min(2, esperaSimulada(agora)) : esperaSimulada(agora);
  return r({
    regra, motivo, acao: 'encaminhar_humano', resolvida: false, fontes: fontesTudo, cartoes, entrega: { ...entrega, espera },
    texto: `${intro ? intro + '\n\n' : ''}Estou passando você para uma pessoa da nossa equipe. Espera estimada: ${espera} min${prio ? ', com prioridade' : ''}. Quem atende já vê esta conversa, então você não precisa repetir nada.`,
  });
}

function golpe(ctx, t) {
  const exposto = /(passei|coloquei|informei|digitei|ja fiz|transferi|mandei)/.test(t);
  return r({
    regra: 5, motivo: 'suspeita de golpe', acao: 'seguranca_imediata', resolvida: false, fontes: kb('KB-019', 'KB-020'),
    entrega: { fila: 'seguranca', motivo: 'suspeita de golpe', regra: 5, prioridade: true, espera: 0 },
    cartoes: [{ tipo: 'golpe', exposto }],
    texto: `Pare agora: isso tem sinais de golpe. Não passe senha, código nem faça transferência. A Caqui nunca pede isso, nem por ligação nem por mensagem.${exposto ? ' Como você já informou algo, é urgente: a equipe de segurança precisa saber agora.' : ''}\n\nA equipe de segurança já está com o seu caso, a qualquer hora e sem fila. Se quiser, bloqueie o acesso agora: a sessão é encerrada em todos os aparelhos.`,
  });
}

function recomendacao(ctx) {
  return r({
    regra: 4, motivo: 'pedido de recomendação', acao: 'encaminhar_especialista', resolvida: false, fontes: kb('KB-029'),
    entrega: { fila: 'especialista', motivo: 'pedido de recomendação', regra: 4, prioridade: ctx.cliente?.idade >= 60 },
    sugestoes: ['O que é um CDB?', 'O que é liquidez diária?', 'O que é LCI e LCA?'],
    texto: 'O atendimento da Caqui explica como os produtos funcionam, mas não indica onde investir. Essa escolha depende do seu perfil e dos seus objetivos, e quem olha isso com você é um especialista em investimentos, que atende com agendamento.\n\nJá deixei seu pedido com o especialista. Enquanto isso, posso explicar como cada produto funciona.',
  });
}

function vulneravel(ctx, intro, motivo) {
  return entregar(ctx, {
    fila: 'prioritaria', motivo, regra: 6, prioridade: true, fontes: kb('KB-028', 'KB-018'),
    intro: `${intro}\n\nUma pessoa da nossa equipe, um atendente de verdade, vai olhar isso com você com calma. Seu dinheiro continua aplicado enquanto isso.\n\nA Caqui só transfere para conta de mesma titularidade, nunca para conta de outra pessoa.`,
  });
}

function reclamacao(ctx) {
  return r({
    regra: 7, motivo: 'reclamação', acao: 'protocolo', resolvida: false, fontes: kb('KB-026', 'KB-027'),
    entrega: { fila: 'reclamacao', motivo: 'reclamação', regra: 7, prioridade: ctx.cliente?.idade >= 60 },
    texto: 'Sua reclamação está registrada com protocolo, com tudo o que já foi dito nesta conversa, e a resposta vem em até 7 dias corridos. Você acompanha pelo protocolo no app e pode acrescentar detalhes aqui, se quiser.',
  });
}

function encerramento(ctx) {
  const { cliente, agora } = ctx;
  const texto = 'Pode encerrar, sim. Para encerrar a conta, os investimentos precisam ser resgatados e o saldo transferido para uma conta sua.';
  if (!cliente) return r({ regra: 7, motivo: 'encerramento', fontes: kb('KB-027'), sugestoes: ['Pedir o encerramento'], texto: `${texto} Produtos sem liquidez diária continuam até o vencimento.` });
  const hoje = agora.slice(0, 10);
  const pos = D.posicoes.filter((p) => p.id_cliente === cliente.id);
  const travadas = pos.filter((p) => SEM_RESGATE.has(p.produto) || (p.produto === 'LCI-90D-92' && diasEntre(p.data_aplicacao, hoje) < 90));
  return r({
    regra: 7, motivo: 'encerramento', fontes: [...kb('KB-027', 'KB-005'), conta(cliente.id, 'posições da sua conta')],
    cartoes: [cartaoPosicoes(cliente, hoje)], sugestoes: ['Pedir o encerramento'],
    texto: `${texto} ${travadas.length ? `${travadas.length === 1 ? 'Um investimento seu tem' : `${travadas.length} investimentos seus têm`} data para sair: ${travadas.map((p) => `${nomeProd(p.produto)}${p.vencimento ? ` em ${dataBR(p.vencimento)}` : ''}`).join(', ')}. Esses continuam até lá.` : 'Nenhum dos seus investimentos está travado.'}`,
  });
}

// ---------- dinheiro ----------

function situacaoOp(op, hoje) {
  const data = op.pedido_em.slice(0, 10), hora = op.pedido_em.slice(11, 16);
  const calc = op.tipo === 'resgate' ? prazoResgate(op.produto, data, hora) : null;
  const prevista = op.liquidacao_prevista || calc?.pagamento || null;
  const atrasada = op.status !== 'liquidada' && op.status !== 'recusada' && prevista && (prevista < hoje || /atraso/.test(op.observacao));
  return { calc, prevista, atrasada };
}

const TIPOS = { resgate: 'Resgate', aplicacao: 'Aplicação', transferencia_saida_pix: 'Pix enviado', transferencia_entrada: 'Entrada' };
const STATUS = { pendente: 'Pendente', em_processamento: 'Em processamento', liquidada: 'Liquidada', recusada: 'Recusada' };
const nomeProd = (c) => (c ? produto(c).nome.replace(/ \(.*\)$/, '') : 'Conta Caqui');

export function cartaoCaminho(op, hoje) {
  const { calc, prevista, atrasada } = situacaoOp(op, hoje);
  const etapas = (calc?.etapas || [{ rotulo: 'Pedido', data: op.pedido_em.slice(0, 10) }, ...(prevista ? [{ rotulo: 'Dinheiro na conta', data: prevista }] : [])])
    .map((e) => ({ ...e, data: e.rotulo === 'Dinheiro na conta' ? prevista : e.data }))
    .map((e) => ({ ...e, br: dataBR(e.data), feita: e.data < hoje || op.status === 'liquidada', hoje: e.data === hoje }));
  const notas = calc ? pulados(op.pedido_em.slice(0, 10), prevista) : [];
  return {
    tipo: 'caminho', id: op.id_operacao, titulo: `${TIPOS[op.tipo]} ${nomeProd(op.produto)}`, valor: brl(op.valor_brl),
    status: STATUS[op.status], atrasada: !!atrasada, previsto: prevista ? dataBR(prevista) : null, etapas, notas,
  };
}

function cartaoPosicoes(cliente, hoje) {
  const itens = D.posicoes.filter((p) => p.id_cliente === cliente.id).map((p) => ({ nome: nomeProd(p.produto), valor: brl(p.saldo_bruto_brl), desde: dataBR(p.data_aplicacao) }));
  return { tipo: 'posicoes', conta: brl(cliente.saldo_em_conta_brl), itens, data: dataBR(hoje) };
}

function explicarOp(ctx, op) {
  const hoje = ctx.agora.slice(0, 10);
  const { calc, prevista, atrasada } = situacaoOp(op, hoje);
  const pedidoBR = `${dataBR(op.pedido_em.slice(0, 10))} às ${op.pedido_em.slice(11, 16).replace(':', 'h')}`;
  const cartao = cartaoCaminho(op, hoje);
  const fontes = [conta(op.id_operacao, `operação ${op.id_operacao} da sua conta`)];
  const titulo = `${TIPOS[op.tipo].toLowerCase()} de ${brl(op.valor_brl)} (${nomeProd(op.produto)})`;

  if (op.status === 'recusada') {
    const k = /car[eê]ncia/.test(op.observacao) ? 'KB-011' : 'KB-005';
    return r({
      regra: 1, motivo: 'operação recusada', fontes: [...fontes, ...kb(k)], cartoes: [cartao],
      texto: `Seu pedido de ${titulo} foi recusado, então o dinheiro continua aplicado e rendendo. Motivo: ${op.observacao}.`,
    });
  }
  if (atrasada) {
    return entregar(ctx, {
      fila: 'prioritaria', motivo: `atraso na ${op.id_operacao}`, regra: 1, prioridade: true, fontes: [...fontes, ...kb('KB-008')], cartoes: [cartao],
      intro: `Seu pedido de ${titulo}, previsto para ${dataBR(prevista)}, passou da data e ainda não concluiu. Isso não é o normal, e uma pessoa precisa olhar. O pedido está registrado na sua conta.`,
    });
  }
  if (op.status === 'liquidada') {
    return r({ regra: 1, motivo: 'onde está meu dinheiro', fontes: [...fontes, ...kb('KB-008')], cartoes: [cartao], texto: `Seu pedido de ${titulo} já foi concluído${prevista ? ` em ${dataBR(prevista)}` : ''}. O dinheiro já está na sua conta Caqui.` });
  }
  let motivoBase = '';
  if (calc && calc.base !== op.pedido_em.slice(0, 10)) motivoBase = ` Como o pedido foi feito em ${pedidoBR} (${calc.motivo}), o dia-base é ${dataBR(calc.base)}.`;
  const quando = prevista === hoje ? `cai hoje, ${dataBR(prevista)}` : `cai em ${dataBR(prevista)}`;
  return r({
    regra: 1, motivo: 'onde está meu dinheiro', fontes: [...fontes, ...kb('KB-006', 'KB-008')], cartoes: [cartao],
    texto: `Seu dinheiro está a caminho: ${titulo} ${quando}.${motivoBase} Hoje o status é ${STATUS[op.status].toLowerCase()}.`,
  });
}

function prazoHipotetico(ctx, cod, data, hora) {
  const codigo = cod === 'CDB' ? 'CDB-LD-100' : cod;
  const hoje = ctx.agora.slice(0, 10);
  const fontes = kb('KB-006');
  const nome = cod === 'CDB' ? 'CDB de liquidez diária' : nomeProd(codigo);
  if (hora === null && D.calendario[data]?.dia_util) {
    const cedo = prazoResgate(codigo, data, '12:00'), tarde = prazoResgate(codigo, data, '17:00');
    if (cedo.pagamento === tarde.pagamento) return r({ regra: 1, motivo: 'prazo', fontes, texto: `${nome}: pedido em ${dataBR(data)} cai em ${dataBR(cedo.pagamento)}.` });
    return r({ regra: 1, motivo: 'prazo', fontes, texto: `Depende da hora do pedido. ${nome}, em ${dataBR(data)}: até as 16h, cai em ${dataBR(cedo.pagamento)}. Depois das 16h, cai em ${dataBR(tarde.pagamento)}.` });
  }
  const p = prazoResgate(codigo, data, hora || '12:00');
  const cartao = { tipo: 'caminho', id: null, titulo: `Resgate ${nome}`, valor: null, status: 'Simulação', atrasada: false, previsto: dataBR(p.pagamento), notas: pulados(data, p.pagamento), etapas: p.etapas.map((e) => ({ ...e, br: dataBR(e.data), feita: e.data < hoje, hoje: e.data === hoje })) };
  const cot = p.etapas.find((e) => e.rotulo === 'Cotização');
  const inicio = p.base === data ? `Pedido ${p.motivo}` : `Pedido em ${dataBR(data)} (${p.motivo})${pulados(data, p.base).length ? `, ${pulados(data, p.base).join(', ')}` : ''}`;
  return r({
    regra: 1, motivo: 'prazo', fontes, cartoes: [cartao],
    texto: `${inicio}: ${p.base !== data ? `dia-base ${dataBR(p.base)}, ` : ''}${cot ? `cotização ${dataBR(cot.data)}, pagamento ${dataBR(p.pagamento)}` : `liquidação em ${dataBR(p.pagamento)}`}.`,
  });
}

function dinheiro(ctx, t) {
  const { cliente, agora } = ctx;
  const hoje = agora.slice(0, 10);
  const cod = produtoDe(t), datas = datasDe(t, hoje), hora = horaDe(t);

  if (cod && SEM_RESGATE.has(cod)) return artigos(['KB-005'], 'prazo');
  if (cliente) {
    let ops = D.operacoes.filter((o) => o.id_cliente === cliente.id).sort((a, b) => b.pedido_em.localeCompare(a.pedido_em));
    const valor = t.match(/r\$ ?(?:r\$ ?)?([\d.]+)(?:,\d{2})?/);
    let achadas = ops.filter((o) => o.produto && (cod ? casa(cod, o.produto) : true));
    if (/apliquei|aplicacao/.test(t)) achadas = achadas.filter((o) => o.tipo === 'aplicacao');
    else if (cod || /resgat/.test(t)) achadas = achadas.filter((o) => o.tipo === 'resgate');
    if (datas.length) achadas = achadas.filter((o) => datas.includes(o.pedido_em.slice(0, 10)));
    if (valor) achadas = achadas.filter((o) => o.valor_brl === Number(valor[1].replace(/\./g, '')));
    if (achadas.length === 1) return explicarOp(ctx, achadas[0]);
    const abertas = (achadas.length ? achadas : (cod || datas.length || valor ? [] : ops)).filter((o) => ['pendente', 'em_processamento'].includes(o.status));
    if (abertas.length === 1) return explicarOp(ctx, abertas[0]);
    if (abertas.length > 1) {
      const atrasada = abertas.find((o) => situacaoOp(o, hoje).atrasada);
      if (atrasada) return explicarOp(ctx, atrasada);
      return r({
        regra: 1, motivo: 'onde está meu dinheiro', fontes: [conta(cliente.id, 'operações da sua conta'), ...kb('KB-006', 'KB-008')],
        cartoes: abertas.map((o) => cartaoCaminho(o, hoje)),
        texto: `Você tem ${abertas.length} pedidos a caminho: ${abertas.map((o) => `${TIPOS[o.tipo].toLowerCase()} de ${brl(o.valor_brl)} cai em ${dataBR(situacaoOp(o, hoje).prevista)}`).join('; ')}. Todos estão registrados na sua conta.`,
      });
    }
    if (achadas.length > 1) return explicarOp(ctx, achadas[0]);
    if (cod && cod !== 'CDB' && cod !== 'FUNDO' && datas.length) return prazoHipotetico(ctx, cod, datas[0], hora);
    if (cod === 'CDB' && datas.length) return prazoHipotetico(ctx, cod, datas[0], hora);
    if (valor || cod || datas.length) {
      return r({
        regra: 9, motivo: 'operação não encontrada', resolvida: false, fontes: [conta(cliente.id, 'operações da sua conta')],
        cartoes: [...ops.filter((o) => ['pendente', 'em_processamento'].includes(o.status)).map((o) => cartaoCaminho(o, hoje)), cartaoPosicoes(cliente, hoje)],
        texto: 'Não encontrei esse pedido entre as operações da sua conta. Veja abaixo onde está o seu dinheiro hoje. Se não bater com o que você esperava, uma pessoa da equipe confere com você.',
      });
    }
    return r({
      regra: 1, motivo: 'onde está meu dinheiro', fontes: [conta(cliente.id, 'posições da sua conta')], cartoes: [cartaoPosicoes(cliente, hoje)],
      texto: `Nenhum pedido seu está em andamento. Seu dinheiro está assim em ${dataBR(hoje)}, sendo ${brl(cliente.saldo_em_conta_brl)} disponível na conta.`,
    });
  }
  if (cod && cod !== 'FUNDO' && datas.length) return prazoHipotetico(ctx, cod, datas[0], hora);
  return r({
    motivo: 'prazo sem produto', resolvida: false, fontes: kb('KB-006'), sugestoes: ['CDB de liquidez diária', 'Caqui Renda Fixa', 'Tesouro Selic'],
    texto: 'O prazo depende do produto e da hora do pedido. Qual produto, e quando você pediu?',
  });
}

// ---------- IR e poupança ----------

function posicaoDe(ctx, t, datas) {
  if (!ctx.cliente) return null;
  const cod = produtoDe(t);
  const pos = D.posicoes.filter((p) => p.id_cliente === ctx.cliente.id && (!cod || casa(cod, p.produto)));
  return pos.find((p) => datas.includes(p.data_aplicacao)) || (cod ? pos[0] : null) || null;
}

function imposto(ctx, t) {
  const hoje = ctx.agora.slice(0, 10);
  const datas = datasDe(t, hoje);
  const pos = posicaoDe(ctx, t, datas);
  const cod = produtoDe(t);
  if (cod && ['LCI-90D-92', 'LCA-1A-95'].includes(cod)) return artigos(['KB-011'], 'imposto');
  if (pos) {
    const prod = produto(pos.produto);
    if (['FUNDO-MM-01', 'ACOES'].includes(pos.produto)) {
      return entregar(ctx, { fila: 'geral', motivo: 'IR fora da base', regra: 9, fontes: kb('KB-010'), intro: `A base da Caqui só traz a tabela de IR da renda fixa. Para ${nomeProd(pos.produto)}, prefiro não dar um número que não está nela.` });
    }
    const calc = datas.find((d) => d !== pos.data_aplicacao) || hoje;
    const dias = diasEntre(pos.data_aplicacao, calc);
    const fontes = [conta(pos.id_posicao, `posição ${pos.id_posicao} da sua conta`), ...kb('KB-010')];
    if (!prod.tributavel) return artigos(['KB-011'], 'imposto');
    const a = aliquotaIR(dias);
    const inicio = /valor total|sobre o total/.test(t) ? 'Não. O imposto incide só sobre o rendimento, nunca sobre o valor aplicado. ' : '';
    const texto = `${inicio}${nomeProd(pos.produto)}, aplicado em ${dataBR(pos.data_aplicacao)}: em ${dataBR(calc)} são ${dias} dias corridos, alíquota de ${pct(a)} sobre o rendimento.`;
    if (calc !== hoje) return r({ regra: 2, motivo: 'IR', fontes, texto });
    const l = liquidoPosicao(pos, hoje);
    return r({
      regra: 2, motivo: 'IR', fontes, cartoes: [{ tipo: 'conta', titulo: prod.nome, linhas: [['Saldo bruto', brl(pos.saldo_bruto_brl)], ['Rendimento', brl(l.rendimento)], [`IR de ${pct(a)}`, '- ' + brl(l.ir)], ['Você recebe', brl(l.liquido)]] }],
      texto: `${texto} Rendimento bruto de ${brl(l.rendimento)}, IR de ${brl(l.ir)}.`,
    });
  }
  if (/tudo|quanto (eu )?(vou |vai )?receb/.test(t) && ctx.cliente) return quantoRecebo(ctx);
  const dt = datas[0];
  if (dt && dt < hoje) {
    const dias = diasEntre(dt, hoje);
    return r({ regra: 2, motivo: 'IR', fontes: kb('KB-010'), texto: `Aplicado em ${dataBR(dt)} e resgatado em ${dataBR(hoje)}: ${dias} dias corridos, alíquota de ${pct(aliquotaIR(dias))} sobre o rendimento.` });
  }
  return artigos(/menor|veio/.test(t) ? ['KB-009', 'KB-010'] : ['KB-010'], 'imposto');
}

function quantoRecebo(ctx) {
  const hoje = ctx.agora.slice(0, 10);
  const pos = D.posicoes.filter((p) => p.id_cliente === ctx.cliente.id);
  const cobertas = pos.filter((p) => !['FUNDO-MM-01', 'ACOES'].includes(p.produto) && !SEM_RESGATE.has(p.produto));
  const fora = pos.filter((p) => !cobertas.includes(p));
  const linhas = cobertas.map((p) => [nomeProd(p.produto), brl(liquidoPosicao(p, hoje).liquido)]);
  const soma = cobertas.reduce((s, p) => s + liquidoPosicao(p, hoje).liquido, 0);
  return r({
    regra: 2, motivo: 'líquido', fontes: [conta(ctx.cliente.id, 'posições da sua conta'), ...kb('KB-009', 'KB-010')],
    cartoes: [{ tipo: 'conta', titulo: 'Líquido estimado hoje', linhas: [...linhas, ['Total', brl(soma)]] }],
    texto: `Resgatando hoje, a estimativa líquida é de ${brl(soma)}, depois do imposto.${fora.length ? ` Ficam de fora, porque têm vencimento ou imposto que a base não cobre: ${fora.map((p) => nomeProd(p.produto)).join(', ')}.` : ''}`,
  });
}

function poupanca(ctx, t) {
  const fontes = kb('KB-012', 'KB-009');
  const hoje = ctx.agora.slice(0, 10);
  const c = ctx.cliente;
  if (/taxa|quanto (rende|esta)|rendimento da poupanca/.test(t) && !/rendeu|meu|minha/.test(t)) {
    return r({ regra: 3, motivo: 'taxa', fontes: [{ tipo: 'conta', id: 'taxas', rotulo: 'tabela de taxas da Caqui, valores do desafio' }], texto: `A poupança usada nas comparações da Caqui rende 0,6% ao mês, isenta de imposto. A Caqui não oferece poupança.` });
  }
  const cod = produtoDe(t);
  const pos = c ? D.posicoes.filter((p) => p.id_cliente === c.id && produto(p.produto).pct_cdi && produto(p.produto).tributavel && !p.produto.startsWith('TESOURO') && (cod ? casa(cod, p.produto) : p.produto.startsWith('CDB'))) : [];
  if (!pos.length) return artigos(['KB-012', 'KB-009'], 'poupança');
  const linhas = pos.map((p) => {
    const l = liquidoPosicao(p, hoje), pp = poupancaEquivalente(p.valor_aplicado_brl, l.dias);
    return { p, l, pp, ganhou: l.liquidoRend > pp };
  });
  const frase = ({ p, l, pp, ganhou }) => `${nomeProd(p.produto)}, em ${l.dias} dias: ${brl(l.rendimento)} bruto, ${brl(l.liquidoRend)} líquido com IR de ${pct(l.aliquota)}; poupança no mesmo período ${brl(pp)}. Rendeu ${ganhou ? 'mais' : 'menos'} no líquido.`;
  return r({
    regra: 3, motivo: 'comparar com poupança', fontes: [...linhas.map(({ p }) => conta(p.id_posicao, `posição ${p.id_posicao} da sua conta`)), ...fontes],
    cartoes: linhas.map(({ p, l, pp, ganhou }) => ({ tipo: 'conta', titulo: `${nomeProd(p.produto)}, ${l.dias} dias`, linhas: [['Bruto', brl(l.rendimento)], [`Líquido, IR de ${pct(l.aliquota)}`, brl(l.liquidoRend)], ['Poupança, isenta', brl(pp)], ['Resultado', ganhou ? 'Rendeu mais' : 'Rendeu menos']] })),
    texto: `Comparando líquido com líquido. ${linhas.map(frase).join(' ')}`,
  });
}

// ---------- base citada ----------

const TOPICOS = [
  [/horario de corte|horario limite|ate que horas|corte para resgate/, ['KB-006']],
  [/garantia|fgc|garantid/, ['KB-013']],
  [/diferenca.*(cdb|lci|lca)/, ['KB-003', 'KB-011']],
  [/liquidez diaria/, ['KB-004']],
  [/liquidez|2 anos|tirar .* antes|resgatar antes|vencimento/, ['KB-005']],
  [/multimercado/, ['KB-014']],
  [/\bcdi\b/, ['KB-002']],
  [/\blci\b|\blca\b/, ['KB-011']],
  [/\bcdb\b/, ['KB-003']],
  [/fundo/, ['KB-014']],
  [/tesouro/, ['KB-015']],
  [/\bacoes\b|\bacao\b/, ['KB-016']],
  [/informe|declaracao de imposto/, ['KB-017']],
  [/extrato|movimentacoes/, ['KB-008']],
  [/transfer|mandar .*pix|\bpix\b/, ['KB-018']],
  [/senha|celular novo|troquei de (celular|aparelho)|aparelho novo|biometria|nao consigo entrar/, ['KB-021']],
  [/(mudar|mudei|atualizar|trocar|alterar).*(nome|endereco|telefone|e-?mail|dados|cadastro)|mudei de endereco/, ['KB-022']],
  [/parceria|varejista|pela loja|beneficio/, ['KB-023']],
  [/tarifa|taxa de (manutencao|custodia|abertura|administracao)|cobra/, ['KB-024']],
  [/protocolo/, ['KB-026']],
  [/idos|prioridade/, ['KB-028']],
  [/o que e a caqui|horario de atendimento|que horas .*atend/, ['KB-001']],
];
const NAO_OFERECE = /(previdencia|pgbl|vgbl|cripto|bitcoin|cambio|dolar|euro\b|seguro|consorcio|emprestimo|tem(os)? poupanca|abrir (uma )?poupanca|oferece(m)? poupanca)/;

export function trecho(id) {
  return D.artigos[id].corpo;
}
function artigos(ids, motivo) {
  if (ids.some((i) => OBSOLETOS.has(i))) throw new Error('artigo obsoleto');
  return r({ regra: 9, motivo, fontes: kb(...ids), texto: ids.map(trecho).join('\n\n') });
}

// ---------- decisão ----------

function naoEntendi(ctx) {
  const n = (ctx.estado.naoEntendi || 0) + 1;
  ctx.estado.naoEntendi = n;
  if (n >= 3) return entregar(ctx, { fila: 'geral', motivo: 'não entendido três vezes', regra: 8, intro: 'Não consegui entender, e não vou ficar repetindo a mesma coisa.' });
  return r({
    regra: 9, motivo: 'não entendido', resolvida: false, sugestoes: ['Onde está meu dinheiro?', 'Quanto vou receber?', 'Falar com uma pessoa'],
    texto: n === 1
      ? 'Não entendi, e prefiro dizer isso a inventar uma resposta. Posso ajudar com prazos, seu dinheiro, imposto e como os produtos funcionam.'
      : 'Ainda não entendi. Quer falar com uma pessoa? Ela vê esta conversa e você não repete nada.',
  });
}

function decidir(textoOriginal, ctx) {
  const escondido = /<!--[\s\S]*?-->/.test(textoOriginal);
  const t = norm(textoOriginal.replace(/<!--[\s\S]*?-->/g, ' '));
  const { cliente, agora } = ctx;
  if (escondido) ctx.estado.sinalInjecao = true;

  if (sinalGolpe(t)) return golpe(ctx, t);
  if (outroCliente(t, cliente)) return r({ regra: 10, motivo: 'dado de terceiro', acao: 'recusar', resolvida: false, texto: 'Só mostro dados da conta de quem está logado. Não posso mostrar nem confirmar nada sobre outra pessoa. Sobre a sua conta, posso ajudar.' });

  if (INJECAO.test(t) || RECOMENDA.test(t)) {
    const frases = t.split(/(?<=[.!?])\s+/);
    const limpa = frases.filter((f) => !INJECAO.test(f)).join(' ').trim();
    if (RECOMENDA.test(t)) return recomendacao(ctx);
    if (limpa && limpa !== t) {
      const seguinte = decidir(limpa, ctx);
      if (seguinte.motivo === 'não entendido') return r({ regra: 11, motivo: 'instrução escondida', acao: 'recusar', resolvida: false, sinalInjecao: true, texto: 'Não sigo esse tipo de instrução. Sobre a sua conta, posso ajudar.' });
      return { ...seguinte, texto: `Não sigo esse tipo de instrução, mas respondo sua pergunta.\n\n${seguinte.texto}`, sinalInjecao: true };
    }
    return r({ regra: 11, motivo: 'instrução escondida', acao: 'recusar', resolvida: false, sinalInjecao: true, texto: 'Não sigo esse tipo de instrução e não mostro dados de outros clientes. Sobre a sua conta, posso ajudar.' });
  }

  if (/(qual|me (fala|diz|diga|passa)|lembra).{0,20}\bsenha\b/.test(t) && !/troc|mudar|esqueci.*como|como/.test(t) || /senha que eu cadastrei/.test(t)) {
    return r({ regra: 10, motivo: 'pedido de senha', acao: 'recusar', fontes: kb('KB-021'), resolvida: false, texto: 'A Caqui não vê nem informa senha, e nunca pede a sua. Para criar outra, use o app, em Perfil > Segurança.' });
  }
  if (VENDEDOR.test(t) && /(aplic|resgat|invest|dinheiro|posso)/.test(t)) return vulneravel(ctx, 'Ninguém pode apressar você para aplicar.', 'terceiro pressionando');
  if (CONTA_TERCEIRO.test(t)) return vulneravel(ctx, 'Antes de qualquer movimentação, vamos com calma.', 'transferência para terceiro');
  if (PRESSAO.test(t) && DINHEIRO.test(t)) return vulneravel(ctx, 'Antes de qualquer movimentação, vamos com calma. Ninguém pode apressar você nessa decisão.', 'terceiro pressionando');
  if (CONFUSAO.test(t)) return vulneravel(ctx, 'Tudo bem, vamos com calma.', 'sinal de confusão');
  if (RETIRADA_TOTAL.test(t)) return vulneravel(ctx, 'Entendi que você quer tirar tudo.', 'resgate total atípico');
  if (RECLAMA.test(t)) return reclamacao(ctx);
  if (ENCERRA.test(t)) return encerramento(ctx);
  if (/pedir o encerramento/.test(t)) return r({ regra: 7, motivo: 'encerramento', acao: 'protocolo', resolvida: false, fontes: kb('KB-026', 'KB-027'), entrega: { fila: 'reclamacao', motivo: 'pedido de encerramento', regra: 7, prioridade: false }, texto: 'Pedido de encerramento registrado com protocolo. Resposta em até 7 dias corridos.' });
  if (HUMANO.test(t)) return entregar(ctx, { fila: 'geral', motivo: 'pediu uma pessoa', regra: 8 });

  if (cliente && /\bcpf\b/.test(t)) return r({ regra: 10, motivo: 'CPF', fontes: [conta(cliente.id, 'cadastro da sua conta')], texto: `Seu CPF aparece sempre mascarado: ${cliente.cpf_mascarado}. Por segurança, o número completo não é exibido aqui.` });
  if (NAO_OFERECE.test(t)) return r({ regra: 9, motivo: 'produto não oferecido', fontes: kb('KB-030'), texto: 'A Caqui não oferece esse produto, então não existe prazo ou taxa para informar. Fora do que temos: poupança, previdência privada, criptoativos, câmbio, seguros, consórcio e empréstimos.' });
  if (/horario de corte|corte para resgate/.test(t)) return r({ regra: 9, motivo: 'corte', fontes: kb('KB-006'), texto: trecho('KB-006') });
  if (/poupanca/.test(t)) return poupanca(ctx, t);
  if (/\b(aliquota|imposto|\bir\b|tributo)\b|veio menor|menor que o saldo|quanto (eu )?(vou |vai )?receb|se eu tivesse resgatado/.test(t)) return imposto(ctx, t);
  if (/multimercado.*(caiu|perd|queda)|pode perder/.test(t)) return artigos(['KB-014'], 'produto');
  if (/(meu |o )?saldo|meus investimentos|quanto tenho|dinheiro esta la|esta la mesmo/.test(t) && cliente) {
    return r({ regra: 1, motivo: 'saldo', fontes: [conta(cliente.id, 'posições da sua conta')], cartoes: [cartaoPosicoes(cliente, agora.slice(0, 10))], texto: `Seu dinheiro está assim em ${dataBR(agora.slice(0, 10))}, com ${brl(cliente.saldo_em_conta_brl)} disponível na conta.` });
  }
  if (!/(garantia|o que e|como funciona|diferenca)/.test(t) && /(resgat|\bcai\b|caiu|cair|cade|sumiu|dinheiro|processamento|nao aparece|nao entrou|prazo|quando)/.test(t)) return dinheiro(ctx, t);
  for (const [re, ids] of TOPICOS) if (re.test(t)) return artigos(ids, 'produto');
  return naoEntendi(ctx);
}

export function responder({ texto, cliente: idCliente, agora = AGORA_PADRAO, estado = {} }) {
  const cliente = D.clientes.find((c) => c.id === idCliente) || null;
  const ctx = { cliente, agora, estado: { ...estado } };
  const limpo = mascarar(String(texto).slice(0, 800));
  const res = decidir(limpo, ctx);
  if (res.motivo !== 'não entendido') ctx.estado.naoEntendi = res.resolvida ? 0 : ctx.estado.naoEntendi || 0;
  res.texto = mascarar(res.texto);
  res.textoCompleto = res.texto + rodape(res.fontes);
  res.estado = ctx.estado;
  return res;
}

const CLASSES = { CDB: 'CDB', LCI: 'LCI', LCA: 'LCA', TESOURO: 'Tesouro', FUNDO: 'Fundos', ACOES: 'Ações' };

function setoresCarteira(idCliente) {
  const pos = D.posicoes.filter((p) => p.id_cliente === idCliente);
  const total = pos.reduce((soma, p) => soma + p.saldo_bruto_brl, 0);
  const somas = {};
  for (const p of pos) {
    const tipo = produto(p.produto).tipo;
    somas[tipo] = (somas[tipo] || 0) + p.saldo_bruto_brl;
  }
  return Object.entries(somas).sort((a, b) => b[1] - a[1]).map(([tipo, valor]) => ({ tipo, nome: CLASSES[tipo], valor: brl(valor), pct: Math.round((valor / total) * 1000) / 10 }));
}

export function painelInicial(idCliente, agora = AGORA_PADRAO) {
  const cliente = D.clientes.find((c) => c.id === idCliente);
  if (!cliente) return null;
  const hoje = agora.slice(0, 10);
  const abertas = D.operacoes
    .filter((o) => o.id_cliente === idCliente && ['pendente', 'em_processamento'].includes(o.status) && o.pedido_em.slice(0, 16) <= agora)
    .sort((a, b) => b.pedido_em.localeCompare(a.pedido_em));
  return {
    cliente: { id: cliente.id, nome: cliente.nome.split(' ')[0], idade60: cliente.idade >= 60 },
    conta: brl(cliente.saldo_em_conta_brl),
    carteira: brl(D.posicoes.filter((p) => p.id_cliente === idCliente).reduce((soma, p) => soma + p.saldo_bruto_brl, 0)),
    data: dataBR(hoje),
    total: brl(cliente.saldo_em_conta_brl + D.posicoes.filter((p) => p.id_cliente === idCliente).reduce((soma, p) => soma + p.saldo_bruto_brl, 0)),
    setores: setoresCarteira(idCliente),
    investimentos: D.posicoes.filter((p) => p.id_cliente === idCliente).map((p) => {
      const pedidos = abertas.filter((o) => o.produto === p.produto).map((o) => cartaoCaminho(o, hoje));
      const etapas = [
        { rotulo: 'Aplicação', br: dataBR(p.data_aplicacao), feita: true },
        { rotulo: 'Hoje', br: dataBR(hoje), agora: true },
        ...pedidos.map((c) => ({ rotulo: c.titulo.split(' ')[0], valor: c.valor, br: c.previsto || 'a confirmar' })),
        ...(p.vencimento ? [{ rotulo: 'Vencimento', br: dataBR(p.vencimento) }] : []),
      ];
      const andamento = p.vencimento ? Math.min(100, Math.round((diasEntre(p.data_aplicacao, hoje) / Math.max(diasEntre(p.data_aplicacao, p.vencimento), 1)) * 100)) : null;
      return { nome: nomeProd(p.produto), valor: brl(p.saldo_bruto_brl), taxa: p.taxa_contratada === 'n/a' ? '' : p.taxa_contratada, etapas, andamento };
    }),
    pedidos: abertas.map((o) => cartaoCaminho(o, hoje)),
  };
}

export function extratoCliente(idCliente, agora = AGORA_PADRAO) {
  const cliente = D.clientes.find((c) => c.id === idCliente);
  if (!cliente) return null;
  const itens = D.operacoes
    .filter((o) => o.id_cliente === idCliente && o.pedido_em.slice(0, 16) <= agora)
    .sort((a, b) => b.pedido_em.localeCompare(a.pedido_em))
    .map((o) => ({ id: o.id_operacao, data: dataBR(o.pedido_em.slice(0, 10)), titulo: `${TIPOS[o.tipo]} ${nomeProd(o.produto)}`, valor: brl(o.valor_brl), status: STATUS[o.status] }));
  return { cliente: cliente.nome.split(' ')[0], conta: brl(cliente.saldo_em_conta_brl), data: dataBR(agora.slice(0, 10)), itens };
}

export function fichaCliente(idCliente, agora = AGORA_PADRAO) {
  const c = D.clientes.find((x) => x.id === idCliente);
  if (!c) return null;
  const hoje = agora.slice(0, 10);
  return {
    id: c.id, nome: c.nome, idade: c.idade, cpf: c.cpf_mascarado, canal: c.canal_preferido, origem: c.origem,
    cartoes: [cartaoPosicoes(c, hoje), ...painelInicial(idCliente, agora).pedidos],
  };
}

export const artigoPublico = (id) => {
  const a = D.artigos[id];
  return a && { id: a.id, titulo: a.titulo, revisado: dataBR(a.revisado_em), corpo: a.corpo, obsoleto: OBSOLETOS.has(id) };
};
export { proximoDU, diaBase };
