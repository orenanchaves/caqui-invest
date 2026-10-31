# Atendimento da Caqui Invest

**URL pública:** https://caqui.pages.dev **Spec:** [SPEC.md](SPEC.md).

O atendimento responde a pergunta que mais chega à Caqui, "onde está meu dinheiro?", com data calculada, fonte em toda resposta e uma pessoa a um toque. Quem atende recebe o caso com protocolo, histórico e dados conferidos.

- `/`: conversa do cliente. Escolha cliente e hora na barra de demonstração.
- `/atendente.html`: fila e caso como chegam à equipe.
- `/extrato.html`: movimentações do cliente, aberta pelo atalho Extrato.
- `/design-system.html`: tokens e componentes do front-end. Regras em [DESIGN.md](DESIGN.md).

O motor é determinístico e roda no servidor. Sem modelo de linguagem em produção: prazo, imposto e poupança saem de cálculo, e o resto sai de trecho literal da base. Se não entender, diz que não entendeu e leva a uma pessoa.

Ícones dos atalhos: Freepik, via Flaticon.

## Rodar

```bash
npm run dados
npm test
npm run perguntas
wrangler dev --port 8799
```

Publicar: `npm run publicar`.

## Como foi verificado

| Verificação | Resultado |
| --- | --- |
| `ferramentas/checar_respostas.py`, 40 perguntas | 40/40 nas pistas, com as respostas lidas uma a uma |
| `scripts/auditar-operacoes.mjs`, datas contra `operacoes.csv` | 62 de 62 batem; 48 datas vazias preenchidas pelo cálculo |
| `scripts/replay.mjs`, 300 conversas rotuladas | Golpe 20/20 sem falso alarme; recomendação 24/24; injeção 10/10; vulnerável 11/12 |
| Teste cego 1, 70 frases de um agente que não viu o código | 46/70 na primeira rodada |
| Teste cego 2, 50 frases novas, depois de ajustar para o 1 | **37/50**, zero falso alarme nas 10 inocentes |

O replay usa frases que vieram antes do código, então mede pouco. **A nota honesta de frases novas é 37/50.** Dos 13 erros, dois golpes ficaram sem encaminhamento, dois foram para humano em vez de segurança, e um é divergência com o gabarito oficial (CPF). Em nenhum caso o motor recomendou produto ou mostrou dado de terceiro. Depois disso as regras foram ajustadas de novo para esses casos, então rodar `test/cego2.jsonl` agora não vale como medida.

Limites conhecidos:

- A contenção da SPEC é hipótese. As mensagens de `conversas.csv` não correspondem às operações de cada cliente, então o replay não a mede.
- O tempo de espera mostrado é simulado, com rótulo na tela.
- Login é simulado. O painel do atendente é público na demonstração, com dados fictícios e casos que expiram em 48 horas.
- A regra por palavra não generaliza. O próximo passo é um classificador que só escolhe a rota.

## Como usamos IA

### Ferramentas

Claude Code com Claude Opus 5.5 em leitura do case, spec, código, testes e interface. Dois subagentes Claude Sonnet escreveram os testes cegos sem acesso ao código. Cloudflare Workers no deploy.

### Harness

No repositório: [AGENTS.md](AGENTS.md) com as instruções do projeto, hook de commit em [.githooks/pre-commit](.githooks/pre-commit) e [scripts/guarda-commit.mjs](scripts/guarda-commit.mjs), que barra CPF sem máscara e chave de API (ligar com `npm run guardas`), e os testes em `test/motor.test.mjs`, `test/cego.jsonl` e `test/cego2.jsonl`. O `AGENTS.md` e o hook entraram depois da solução pronta, ao reler a apresentação de fundamentos: o motor não foi feito com eles.

Fora do repositório: `CLAUDE.md` global do autor, skills `conferir-entrega` (medição em 375 e 1440) e `hallmark` (piso visual e `sloplint`), navegador embutido para testar a tela.

### Verificado na mão

Leitura das 40 respostas, inclusive as que passaram. PT-06, PT-10 e PT-11 conferidos centavo a centavo contra a `resposta_esperada`. Fluxo na tela: golpe com CPF digitado, mascarado no histórico do painel; pedido de humano às 23h; artigo aberto pela fonte.

### Onde a IA errou

A IA escreveu as regras depois de ler as frases da amostra e chegou a 40/40 no teste oficial e 20/20 em golpe. Parecia pronto. O teste cego deu 46/70: "o rapaz da caqui disse que é só falar os 6 números" caía em "não entendi", e "meu app abriu sozinho e tem um pix que eu não fiz" recebia um artigo sobre transferências. A nota alta media decoreba. Mudou o método: passamos a medir com frases de quem não viu o código, e cada rodada só vale uma vez. Mudou a spec: o classificador virou o próximo passo.

Outro erro: a primeira versão do replay contava qualquer encaminhamento como injeção detectada e deu 43 falsos alarmes. Era a métrica, não o motor.

---

# Caqui Invest: atendimento que escala com confiança

Case aberto do **Hands On com IA: da concepção à produção**, 31/10/2026.

A Caqui Invest é uma corretora fictícia que vai sair de 400 mil para 2 milhões de clientes em 18 meses, e o time de atendimento só pode ir de 62 para 100 pessoas. O desafio é atender essa base sem a satisfação cair e sem perder a confiança de quem está entregando o próprio patrimônio.

Não há trilha, formato esperado nem resposta certa. O grupo lê os dados, escolhe a parte do problema que quer atacar, escreve a spec e leva a solução até uma URL pública no mesmo dia, com IA em todas as etapas.

> Tudo aqui é fictício: a empresa, as pessoas, os CPFs, as taxas, os saldos e as conversas. As regras são simplificadas para o desafio e não substituem a norma vigente.

## Por onde começar

1. Clique em **Use this template** para criar o repositório do grupo (público ou privado, como preferirem). Fork também funciona, mas um fork de repositório público fica público.
2. Leia o [CASE.md](CASE.md): contexto, números, personas e as doze regras.
3. Explore a pasta [`dados/`](dados/). O [README dos dados](dados/README.md) descreve cada arquivo e campo.
4. Antes de qualquer código, preencha o [SPEC.md](templates/SPEC.md) com as respostas às seis perguntas.
5. Construa, verifique e publique.

## O que tem aqui

```
.
├── CASE.md                    o case completo: contexto, números, personas e regras
├── dados/                     pacote de dados sintéticos, igual para todos os grupos
│   ├── README.md              descrição dos arquivos e campos
│   ├── base_conhecimento/     30 artigos de ajuda (KB-001 a KB-030)
│   ├── clientes.json          50 clientes fictícios
│   ├── posicoes.csv           146 posições em 18/11/2026
│   ├── operacoes.csv          400 aplicações, resgates e transferências
│   ├── conversas.csv          300 conversas rotuladas do atendimento atual
│   ├── calendario.json        dias úteis e feriados de out/2026 a dez/2027
│   ├── taxas.json             CDI, poupança, IR e regras dos produtos
│   └── perguntas_teste.jsonl  40 perguntas com resposta esperada, por regra
├── templates/
│   ├── SPEC.md                as seis perguntas que a spec responde
│   └── COMO-USAMOS-IA.md      seção para colar no README do grupo
└── ferramentas/
    └── checar_respostas.py    confere as respostas da solução contra perguntas_teste.jsonl
```

**"Agora" nos dados é 18/11/2026, 10h (horário de Brasília).** Saldos, status de operações e prazos foram calculados a partir dessa data.

## O que vale para qualquer caminho

1. Saída para humano visível em qualquer passo, das 8h às 20h. Fora desse horário, a solução registra o protocolo e informa o prazo de retorno.
2. Nenhuma recomendação de investimento. A solução explica conceitos e encaminha o pedido de recomendação para um especialista humano.
3. Toda informação factual mostra de onde veio: o artigo da base de conhecimento ou o dado da conta.
4. Suspeita de golpe interrompe o fluxo e encaminha para segurança na hora, sem fila.
5. O cliente nunca repete a demanda. Quem recebe o caso vê o histórico e o protocolo.
6. Só dados sintéticos. Nenhum dado real de pessoa, mesmo que seja do próprio participante.

Se a solução não conversa com o cliente (uma ferramenta interna ou um painel, por exemplo), os itens 1, 3, 4 e 5 que não se aplicarem saem com justificativa na spec. Os itens 2 e 6 valem sempre.

## Conferir as respostas

O `perguntas_teste.jsonl` traz, para cada pergunta, a resposta esperada, a ação esperada e pistas de texto (`deve_conter` e `nao_deve_conter`). Façam a solução responder às perguntas das regras que vocês tratam e gravem um JSONL assim:

```json
{"id": "PT-01", "resposta": "O pagamento cai em 05/11/2026...", "acao": "responder"}
```

Depois rodem (Python 3.9 ou mais novo, sem dependências):

```bash
python3 ferramentas/checar_respostas.py respostas.jsonl --regras 1,4,5
```

O script confere as pistas e a ação, e mostra o resultado por regra. As pistas não substituem o critério, que é a `resposta_esperada`: uma resposta pode passar nas pistas e mesmo assim estar errada. Leiam as respostas que passaram também.

## Regras do dia

- O Hands On não é competição: ninguém ganha e ninguém é ranqueado.
- Ferramenta, licença, repositório, conta de nuvem e deploy são de cada participante.
- Os mentores tiram dúvidas e dão direção, mas não põem a mão no teclado nem escolhem o problema pelo grupo.
- Nenhum segredo (chave de API, token) vai para o repositório. Se vazar, o grupo gira a chave na hora. O `.gitignore` já ignora `.env`.
- Nada que imite marca real. O produto é da Caqui, que é fictícia.
- Só dados sintéticos, sempre.

## Como o dia termina

Cada grupo mostra em poucos minutos o problema que escolheu e por quê, o produto rodando na URL pública e um momento em que a IA errou e o grupo percebeu. Para facilitar a conversa, deixem no repositório do grupo:

- `SPEC.md` com as respostas às seis perguntas ([modelo](templates/SPEC.md))
- uma seção **Como usamos IA** no README: ferramentas, harness e skills, e o que foi verificado na mão ([modelo](templates/COMO-USAMOS-IA.md))
- o link da URL pública no topo do README

## Dúvidas e erros nos dados

Achou dado inconsistente, regra ambígua ou artigo desatualizado? Parte disso é de propósito (a base tem pelo menos um artigo desatualizado). Se não for, abra uma issue aqui. Questionar os dados também conta como resultado.
