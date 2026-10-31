# SPEC: atendimento Caqui

**Grupo:** Renan Chaves
**URL pública:** https://caqui.pages.dev

> Escrita antes do código. Mudou durante o dia? Atualizar aqui e anotar em "Decisões".

A solução é o atendimento da Caqui para a pergunta que mais chega: "onde está meu dinheiro?". O cliente vê o caminho do dinheiro com datas calculadas, sabe de onde veio cada informação e tem uma pessoa a um toque. Quem atende recebe o caso pronto.

## 1. Qual parte do problema?

**Motivo:** "Onde está meu dinheiro" (aplicação, resgate, liquidação, transferência).
**Persona central:** Dona Marta, com Rafael como teste de velocidade e Jonas recebendo os casos.

Por que esse:

- É o maior volume: 12.960 contatos por mês, 27% do total.
- É o maior recontato: 34% no case. Refazendo a conta em `dados/conversas.csv` deu 44% nas 81 conversas da amostra.
- A resposta é calculável. Status, corte das 16h, calendário e prazo do produto estão nos dados. Não depende de interpretar nada, e por isso dá para acertar sempre.
- O erro hoje é mecânico: 16 conversas da amostra têm "bot ignorou o corte das 16h e o fim de semana".
- O público novo vem da poupança. Quem liga para confirmar cada aplicação é exatamente quem esse motivo perde.

Para responder sobre dinheiro com segurança, a porta de entrada precisa tratar o que chega misturado: golpe no meio da frase, pedido de recomendação, cliente vulnerável. Por isso a solução cobre as doze regras, mesmo com o foco em um motivo. Rentabilidade, IR e dúvida de produto entram porque usam o mesmo motor de cálculo e a mesma base citada.

## 2. Qual alavanca?

1. **Evitar o contato:** ao abrir o app, o cliente já vê os pedidos em aberto com a data calculada, sem precisar perguntar.
2. **Resolver sem humano:** perguntas de prazo, IR, líquido contra poupança e conceito, respondidas com cálculo ou trecho literal da base.
3. **Humano rende mais:** o caso chega com protocolo, histórico, operação, prazo calculado e o motivo do encaminhamento. O cliente não repete nada.

## 3. Quanto isso move?

| Premissa | Valor | De onde veio |
| --- | --- | --- |
| Horas de atendente por mês, hoje | 9.560 h | Tabela de motivos do case |
| Horas: onde está meu dinheiro | 1.728 h | Case |
| Horas: rentabilidade e extrato | 1.456 h | Case |
| Horas: dúvida de produto | 2.128 h | Case |
| Horas: impostos e documentos | 432 h | Case |
| Contenção sem humano, por motivo | coluna da conta abaixo | Hipótese. O replay de `conversas.csv` não mede isso, porque as mensagens da amostra não correspondem às operações de cada cliente |
| Tempo salvo por contato que chega a humano com ficha | 2 min | Hipótese a validar, 17% dos 12 min médios |

**Conta, na base de hoje (48 mil contatos):**

| Motivo | Horas | Contenção | Horas liberadas |
| --- | ---: | ---: | ---: |
| Onde está meu dinheiro | 1.728 | 70% | 1.210 |
| Rentabilidade e extrato | 1.456 | 50% | 728 |
| Dúvida de produto | 2.128 | 40% | 851 |
| Impostos e documentos | 432 | 60% | 259 |
| **Subtotal** | | | **3.048** |

Contatos que ainda chegam a humano: 48.000 menos 9.072, 3.360, 3.648 e 2.592 dá 29.328. Com 2 min salvos em cada um: 978 h.

Total: **cerca de 4.026 h por mês, 42% das 9.560 h**.

**O que isso não resolve:** com 5x a base são 47.800 h de demanda e 100 atendentes entregam 15.419 h (9.560 ÷ 62 × 100), ou seja, é preciso cortar 68%. A solução chega a 42%. O resto precisa vir de outras frentes: acesso e segurança, formação do atendente, recontato. O recontato evitado não entra na conta, então existe folga, mas ela não foi medida.

## 4. Como a confiança aparece?

- **Caminho do dinheiro:** rastreio no formato de entrega com pedido, dia-base, cotização e pagamento, com as datas e o motivo de cada salto ("depois das 16h", "02/11 é feriado").
- **Fonte em toda resposta:** artigo com data de revisão, ou operação da conta. Tocar na fonte abre o artigo.
- **Nada gerado:** resposta factual sai de cálculo ou de trecho literal da base. Não há modelo de linguagem em produção, portanto não há como inventar prazo.
- **Saída fixa na tela:** "Falar com uma pessoa" fica no topo do chat, que o orb abre em um toque. "Reclamar", "Encerrar", "Suspeita de golpe" e o horário ficam em "Mais opções", no chat aberto pelo orb. Dentro do chat, "Falar com uma pessoa" fica no topo. Golpe escrito na conversa interrompe o fluxo do mesmo jeito.
- **Diz quando não sabe:** e na segunda vez já oferece uma pessoa.

## 5. O que fica de fora?

- Modelo de linguagem em produção. Entender o cliente é por regras e palavras. Quem escreve de um jeito não previsto cai em "não entendi" e chega rápido a uma pessoa. Troca-se abrangência por confiabilidade, como o case pede.
- Executar resgate, aplicação ou bloqueio real. O bloqueio de sessão é simulado.
- Login real. A demonstração escolhe o cliente fictício, e o texto da conversa nunca muda isso.
- Telefone e WhatsApp. Só chat web, com áudio transcrito pelo navegador quando ele oferece esse recurso.
- Conversa real com o atendente. O painel mostra como o caso chega.
- Tempo de espera real. O número mostrado é simulado, com rótulo visível: 35 min no pico (dado do case) e uma estimativa fixa fora dele.
- Geração de documento (extrato em PDF, informe). A resposta diz onde encontrar, quando a base diz.
- Cálculo de IR de multimercado e ações. A base só cobre renda fixa, então a resposta diz isso e passa para uma pessoa.

## 6. Quais regras do case vocês tratam?

Todas. Os itens de "O que vale para qualquer caminho" valem integralmente, porque a solução conversa com o cliente.

| # | Regra | Trata? | Como vira teste | Se não trata, por quê |
| --- | --- | --- | --- | --- |
| 1 | Liquidação | Sim | PT-01 a 05 e `test/motor.test.mjs`; auditoria de todas as operações contra a data calculada | |
| 2 | IR regressivo | Sim | PT-06 a 09, fronteiras 180/181, 360/361, 720/721 | |
| 3 | Comparação com a poupança | Sim | PT-10 a 12, valores conferidos contra a resposta esperada | |
| 4 | Sem recomendação | Sim | PT-13 a 17 e PT-36, mais a varredura do replay | |
| 5 | Golpe | Sim | PT-18 a 21; recall sobre as conversas rotuladas `golpe` | |
| 6 | Cliente vulnerável | Sim | PT-22 a 24; resgate atípico | |
| 7 | Reclamação e cancelamento | Sim | PT-25, 26; zero tentativa de retenção | |
| 8 | Sem doom loop | Sim | PT-27, 28; teste de passos | |
| 9 | Não sabe, diz que não sabe | Sim | PT-29 a 31; KB-007 fora do índice | |
| 10 | Dados pessoais | Sim | PT-32, 33; CPF digitado é mascarado em tela, caso e log | |
| 11 | Instrução escondida | Sim | PT-34 a 36; id do cliente nunca vem do texto | |
| 12 | Horário | Sim | PT-37, 38; segurança a qualquer hora | |

Itens de "O que vale para qualquer caminho" que não se aplicam: nenhum.

## 7. Como viabilizar esta solução?

1. Ligar o motor a dados reais: trocar os arquivos por leitura de status de operação e calendário no sistema da corretora, em modo somente leitura.
2. Rodar em sombra por 30 dias: o motor responde em paralelo e o atendente compara. Só sobe para o cliente o assunto com zero erro de data.
3. Liberar por motivo e por parte da base, começando por quem veio da parceria, medindo recontato em 7 dias, satisfação e taxa de encaminhamento.
4. Colocar um modelo de linguagem só para **classificar** a mensagem, nunca para escrever dado. O cálculo e a citação continuam no motor.
5. Revisão de compliance das regras e dono da base de conhecimento, com alerta para artigo vencido.

## Decisões

| Quando | Decisão | Por quê |
| --- | --- | --- |
| 31/10 | Motor determinístico, sem modelo de linguagem em produção | Regras 1, 2, 3, 9 e 11 são erro típico de modelo. Sem geração não há o que alucinar nem injetar, e não há chave para vazar |
| 31/10 | Motor no servidor (Cloudflare Worker), não no navegador | Num site estático todos os clientes iriam para o navegador. Regra 10: só sai a conta da sessão |
| 31/10 | Zero tentativa de retenção | A regra permite uma. Em encerramento, mostrar o que trava o saque ajuda mais que reter |
| 31/10 | KB-007 fora do índice, por lista e por teste | Artigo de 2024 com corte de 15h, superado pelo KB-006 |
| 31/10 | Tela inicial com saldo, atalhos e pedidos antes da conversa | O cliente vê a data sem precisar perguntar. Os atalhos enviam a mesma pergunta ao motor, sem caminho novo de resposta |
| 31/10 | Identidade da Caqui com o logo oficial e Montserrat no lugar da Proxima Nova | A Proxima Nova é licenciada e não há arquivo da fonte no projeto. Basta servir o arquivo para ela assumir, porque já é a primeira da lista |
| 31/10 | Rodapé fechado por padrão, só com o orb e "Falar com uma pessoa" | A tela estava poluída. A saída para humano segue visível, como o case pede, e as outras saídas abrem com um toque |
| 31/10 | Caixinha abre ao toque, com a timeline, e as caixinhas ficam uma embaixo da outra | A tela fechada mostra só nome, valor e taxa. Aplicação, hoje, pedido em aberto e vencimento aparecem quando o cliente pede |
| 31/10 | O chat se chama caquIA; a solução segue sem nome próprio | O nome identifica a conversa automática, e o app continua sendo da Caqui |
| 31/10 | Chat em popup no centro da tela e rastreio horizontal | A tela inicial fica limpa até o cliente acionar. O rastreio usa um padrão que o cliente já conhece das entregas |
| 31/10 | Tela inicial sem botão de pessoa | A saída fica a um toque, no chat. Isso afasta a tela inicial do item "visível em qualquer passo" do case, por escolha do autor |
| 31/10 | Gráfico de setores só com as classes dos dados | Dólar e euro não existem em `dados/`, e o case proíbe inventar informação |
| 31/10 | Áudio transcrito no campo, sem envio automático | O cliente confere o texto antes de enviar, e a transcrição é do navegador |
| 31/10 | Três formas de ver o dinheiro: caixinhas, lista e gráfico | Cada cliente confere de um jeito. Dona Marta tende a preferir a lista, com cada passo à vista. Hipótese, sem teste com clientes |
| 31/10 | Aplicar e Resgatar orientam com o KB-006, sem executar | O produto não faz operações. Os botões abrem o artigo de prazos, com fonte, e avisam isso na conversa |
| 31/10 | Medir com teste cego escrito por um agente que não viu o código | 40/40 no teste oficial não dizia nada: a primeira rodada cega deu 46/70, com golpes passando |
| 31/10 | Última nota limpa: 37/50 em frases novas, zero falso alarme em 10 inocentes | Depois disso as regras foram ajustadas de novo, então qualquer nota posterior nesses arquivos está contaminada |
| 31/10 | Classificador com modelo de linguagem sobe de item futuro para o próximo passo | Regra por palavra não generaliza. O cálculo e a citação ficam no motor; o modelo só escolheria a rota |
| 31/10 | Faixa da home muda de cor com o status: pendente aparece como "em análise", e pedido concluído ou recusado fica na faixa por um dia | Mesma leitura das telas do Figma, usando só os status que existem nos dados |
| 31/10 | Orb deixa de flutuar e vira item da barra de menu | A barra já é o caminho fixo, e o orb flutuante competia com ela |
| 31/10 | Home de desktop no formato do Figma, com tabela de produtos e cartões à direita, sem logo e sem "Olá" | Mantém as regras de marca. O valor contra a poupança sai do mesmo cálculo líquido do chat, e o FGC usa o texto do KB-013, que não cita o limite em reais |
| 31/10 | Logo oficial na barra do desktop, além da abertura | Decisão do Renan: a barra tem espaço e segue o Figma. O celular continua sem logo depois da abertura |
| 31/10 | Depois da entrega, a conversa vai para a equipe por `/api/casos/:protocolo/conversa`, com CPF mascarado e nada de texto no log | O cliente fala com uma pessoa de verdade no mesmo chat, e o atendente responde pelo painel. Fora do horário segue só o protocolo |
