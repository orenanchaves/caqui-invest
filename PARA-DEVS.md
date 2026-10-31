# Para devs

Guia para implementar o atendimento Caqui. UI e UX por Renan Chaves.

## Rodar

O projeto é JavaScript com módulos ES, sem etapa de build no front-end.

```bash
npm install
npx wrangler dev --port 8799
```

Antes de dizer que terminou, rode os dois:

```bash
npm test
npm run perguntas
```

## Onde está cada coisa

| Caminho | O quê |
| --- | --- |
| `public/tokens.css` | Fonte única de cor, fonte, tamanho e raio |
| `public/estilo.css` | Todos os componentes |
| `public/app.js`, `public/ui.js` | Home e chat |
| `src/motor.mjs` | Regras do atendimento, sem modelo de linguagem |
| `src/worker.mjs` | Rotas da API |
| `dados/` | Dados sintéticos |
| `design-system/tokens.json` | Os mesmos tokens em JSON, para levar a outro stack |
| `DESIGN.md` | Regras de marca e lista de componentes |
| `SPEC.md` | Decisões e comportamento |

## Usar os tokens

No HTML, carregue a fonte de reserva e o CSS:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap">
<link rel="stylesheet" href="estilo.css">
```

No componente, use sempre a variável:

```css
.meu-cartao {
  background: var(--color-card);
  color: var(--color-ink);
  border-radius: var(--radius);
  box-shadow: var(--sombra);
}
```

Nunca escreva cor, fonte ou raio direto no componente.

## Levar para React

As classes funcionam em qualquer stack. Importe `tokens.css` e `estilo.css` uma vez na entrada e use `className`:

```jsx
const ROTULOS = { andamento: 'em andamento', analise: 'em análise', atrasado: 'atrasado', concluido: 'concluído', recusado: 'recusado' };

export function FaixaPedido({ pedido, aoFechar }) {
  const tipo = pedido.titulo.split(' ')[0];
  return (
    <div className="destaque" data-situacao={pedido.situacao}>
      <div className="destaque-topo">
        <strong>{tipo} {ROTULOS[pedido.situacao]}</strong>
        <button className="destaque-fechar" aria-label="Fechar aviso" onClick={aoFechar}>×</button>
      </div>
    </div>
  );
}
```

Neste exemplo, o rótulo não trata "Aplicação atrasada". O código real faz essa concordância em `public/app.js`, na função `rotuloSituacao`.

## Estados por atributo

| Atributo | Onde | Valores |
| --- | --- | --- |
| `data-situacao` | `.destaque` | `andamento`, `analise`, `atrasado`, `concluido`, `recusado` |
| `data-vista` | `.carteira` | `caixinhas`, `lista`, `grafico` |
| `aria-current="page"` | item de `.menu-base` | Tela atual |
| `aria-current="step"` | item de `.rastreio` | Etapa atual |
| `.oculto` | `#home` | Esconde os valores |
| `.humano` | `.chat` | Conversa passada para a equipe |

Preferências em `localStorage`: `vista`, `valores` e `demo`. Em `sessionStorage`, `demo-escolha` guarda o cliente da demonstração. Todo acesso fica em `try/catch`.

## API

| Rota | Uso |
| --- | --- |
| `GET /api/demo` | Clientes e horários da demonstração |
| `GET /api/inicio?cliente=C-0001&agora=2026-11-18T10:00` | Dados da home |
| `GET /api/extrato?cliente=C-0001&agora=2026-11-18T10:00` | Extrato e nome da conta |
| `POST /api/mensagem` | Resposta do motor |
| `GET /api/artigo/KB-006` | Artigo da base |
| `GET /api/casos` | Fila do painel do atendente |
| `GET /api/casos/:protocolo` | Um caso |
| `GET /api/casos/:protocolo/conversa` | Mensagens entre cliente e equipe |
| `POST /api/casos/:protocolo/conversa` | Envia `{ de, texto }` para a conversa |

`POST /api/mensagem` recebe `{ cliente, agora, estado, historico, texto }` e devolve o novo `estado`. Quando devolve `acao: "seguranca_imediata"`, o front abre o aviso de golpe.

`GET /api/inicio` devolve, entre outros, `pedidos` para os pedidos abertos e `recentes` para os concluídos ou recusados há até um dia. Cada cartão traz `situacao`, que define a cor da faixa.

## Regras que não mudam

- Modelo de linguagem nunca escreve prazo, taxa ou valor.
- Toda resposta factual cita o artigo da base ou o dado da conta.
- O id do cliente vem da sessão, nunca do texto da conversa.
- Log só com protocolo, regra, motivo e ação. CPF sempre mascarado.
- Todo valor em dinheiro usa `--color-ink`, ou creme sobre o topo escuro.
- Só dados sintéticos e nenhum segredo no repositório.
- Regra nova vira teste em `test/motor.test.mjs`.

## Acessibilidade

- Alvos de toque com pelo menos 44px.
- Foco visível com `--color-focus`.
- Animação sempre com alternativa para `prefers-reduced-motion`.
- Mensagens de estado em texto, nunca só por cor.
