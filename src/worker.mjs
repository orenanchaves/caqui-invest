// Borda HTTP do atendimento. O cliente vem da sessão de demonstração e nunca do texto.
// Log só com protocolo e rótulos: nenhum texto de cliente vai para o log (regra 10).
import { AGORA_PADRAO, artigoPublico, extratoCliente, fichaCliente, humanoDisponivel, mascarar, painelInicial, responder } from './motor.mjs';

const DEMO = [
  ['C-0001', 'Dona Marta', 'Resgate caindo hoje'],
  ['C-0002', 'Rafael', 'Multimercado e ações a caminho'],
  ['C-0003', 'Camila', 'Herança na conta'],
  ['C-0041', 'Cliente com atraso', 'Resgate passou da data'],
  ['C-0011', 'Cliente do CDB 85', 'CDB contra poupança'],
  ['C-0030', 'Cliente com resgate concluído', 'Resgate caiu ontem'],
  ['C-0028', 'Cliente com resgate recusado', 'Resgate não liberado'],
];
const HORARIOS = ['2026-11-18T10:00', '2026-11-18T14:00', '2026-11-18T23:00'];
const VALIDADE_CASO = 60 * 60 * 48;

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const agoraValido = (a) => (HORARIOS.includes(a) ? a : AGORA_PADRAO);
const clienteValido = (c) => (DEMO.some(([id]) => id === c) ? c : null);

function novoProtocolo(agora) {
  const sufixo = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `CQ-${agora.slice(0, 10).replace(/-/g, '')}-${sufixo}`;
}

function limparHistorico(h) {
  return (Array.isArray(h) ? h : []).slice(-40).map((m) => ({ de: m?.de === 'caqui' ? 'caqui' : 'cliente', texto: mascarar(String(m?.texto ?? '').slice(0, 1500)) }));
}

async function mensagem(req, env) {
  const c = await req.json().catch(() => ({}));
  const cliente = clienteValido(c.cliente), agora = agoraValido(c.agora);
  const texto = String(c.texto ?? '').trim();
  if (!cliente || !texto) return json({ erro: 'mensagem inválida' }, 400);
  const anterior = c.estado && typeof c.estado === 'object' ? c.estado : {};
  const estado = { naoEntendi: Number(anterior.naoEntendi) || 0, protocolo: /^CQ-\d{8}-[A-F0-9]{4}$/.test(anterior.protocolo) ? anterior.protocolo : null };

  const res = responder({ texto, cliente, agora, estado });
  const historico = [...limparHistorico(c.historico), { de: 'cliente', texto: mascarar(texto.slice(0, 800)) }, { de: 'caqui', texto: res.textoCompleto }];
  if (res.entrega) {
    res.estado.protocolo = res.estado.protocolo || novoProtocolo(agora);
    res.entrega.protocolo = res.estado.protocolo;
    if (env.CASOS) {
      const caso = { protocolo: res.estado.protocolo, criado: agora, ...res.entrega, historico, ficha: fichaCliente(cliente, agora), cartoes: res.cartoes };
      await env.CASOS.put('caso:' + caso.protocolo, JSON.stringify(caso), { expirationTtl: VALIDADE_CASO, metadata: { fila: caso.fila, prioridade: caso.prioridade, motivo: caso.motivo, cliente: caso.ficha.nome, criado: agora } });
    }
  }
  console.log(JSON.stringify({ protocolo: res.estado.protocolo, regra: res.regra, motivo: res.motivo, acao: res.acao }));
  const { texto: corpo, acao, fontes, cartoes, sugestoes, resolvida, entrega, estado: novo } = res;
  return json({ texto: corpo, textoCompleto: res.textoCompleto, acao, fontes, cartoes, sugestoes, resolvida, entrega, estado: novo });
}

// Conversa entre cliente e equipe depois da entrega, guardada à parte do caso.
async function conversaCaso(req, env, protocolo) {
  if (!env.CASOS || !(await env.CASOS.get('caso:' + protocolo))) return json({ erro: 'não existe' }, 404);
  const chave = 'conversa:' + protocolo;
  const lista = JSON.parse((await env.CASOS.get(chave)) || '[]');
  if (req.method !== 'POST') return json(lista);
  const c = await req.json().catch(() => ({}));
  const texto = mascarar(String(c.texto ?? '').trim().slice(0, 800));
  if (!texto) return json({ erro: 'mensagem inválida' }, 400);
  lista.push({ de: c.de === 'equipe' ? 'equipe' : 'cliente', texto });
  await env.CASOS.put(chave, JSON.stringify(lista.slice(-200)), { expirationTtl: VALIDADE_CASO });
  console.log(JSON.stringify({ protocolo, acao: 'mensagem_conversa' }));
  return json(lista);
}

async function casos(env) {
  if (!env.CASOS) return json([]);
  const { keys } = await env.CASOS.list({ prefix: 'caso:', limit: 50 });
  return json(keys.map((k) => ({ protocolo: k.name.slice(5), ...k.metadata })));
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (p === '/api/demo') return json({ clientes: DEMO.map(([id, nome, nota]) => ({ id, nome, nota })), horarios: HORARIOS });
    if (p === '/api/inicio') {
      const c = clienteValido(url.searchParams.get('cliente'));
      const agora = agoraValido(url.searchParams.get('agora'));
      return c ? json({ ...painelInicial(c, agora), humano: humanoDisponivel(agora) }) : json({ erro: 'cliente inválido' }, 400);
    }
    if (p === '/api/extrato') {
      const c = clienteValido(url.searchParams.get('cliente'));
      return c ? json(extratoCliente(c, agoraValido(url.searchParams.get('agora')))) : json({ erro: 'cliente inválido' }, 400);
    }
    if (p === '/api/mensagem' && req.method === 'POST') return mensagem(req, env);
    const art = p.match(/^\/api\/artigo\/(KB-\d{3})$/);
    if (art) { const a = artigoPublico(art[1]); return a ? json(a) : json({ erro: 'não existe' }, 404); }
    if (p === '/api/casos') return casos(env);
    const fala = p.match(/^\/api\/casos\/(CQ-\d{8}-[A-F0-9]{4})\/conversa$/);
    if (fala) return conversaCaso(req, env, fala[1]);
    const caso = p.match(/^\/api\/casos\/(CQ-\d{8}-[A-F0-9]{4})$/);
    if (caso) {
      const v = await env.CASOS?.get('caso:' + caso[1]);
      return v ? new Response(v, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }) : json({ erro: 'não existe' }, 404);
    }
    return env.ASSETS ? env.ASSETS.fetch(req) : new Response('não encontrado', { status: 404 });
  },
};
