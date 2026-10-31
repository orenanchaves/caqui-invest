# Briefing da apresentação: atendimento Caqui

Case aberto da Avenue, Hands On com IA, 31/10/2026.
Autor: Renan Chaves.
Produto no ar: https://caqui.pages.dev
Design system: https://caqui.pages.dev/design-system
Código: https://github.com/orenanchaves/caqui-invest/tree/solucao-cade

## Como montar

- A apresentação é curta, de poucos minutos. O case pede três coisas: o problema escolhido e o porquê, o produto rodando na URL pública e um momento em que a IA errou e como isso foi percebido.
- Use o visual do design system: creme `#fff4e9`, marrom `#2b0b09`, laranja suave `#f6ac78`, ciano `#2edff0` para a etapa atual. Fonte Proxima Nova, ou Montserrat como alternativa.
- Dinheiro sempre em marrom escuro. Texto sobre cor sempre escuro. Sem emoji.
- A solução não tem nome próprio: é o atendimento da Caqui. O chat se chama caquIA, com essa grafia.
- A Caqui Invest é uma corretora fictícia, e todos os dados são sintéticos.
- Mostre 42% e os tempos como hipótese. Não cite outra nota do teste cego além de 37/50.

## Slides

### 1. Título

**Onde está meu dinheiro?**
O atendimento da Caqui que responde antes de a pessoa perguntar.
Renan Chaves.

### 2. O desafio

- A Caqui vai de 400 mil para 2 milhões de clientes em 18 meses.
- O time de atendimento só pode ir de 62 para 100 pessoas.
- É preciso atender 5 vezes mais gente sem perder a confiança de quem está chegando.

### 3. O problema escolhido

**"Onde está meu dinheiro?"**: aplicação, resgate, liquidação e transferência.

- Maior volume: 12.960 contatos por mês, 27% do total.
- Maior recontato: 34% no case, e 44% nas 81 conversas da amostra.
- A resposta é calculável: status, corte das 16h, calendário e prazo do produto estão nos dados.
- O erro de hoje é mecânico: 16 conversas da amostra têm o bot ignorando o corte das 16h e o fim de semana.

Persona central: Dona Marta, que vem da poupança e tem medo de ter perdido dinheiro.

### 4. A solução em três alavancas

1. **Evitar o contato:** ao abrir o app, a pessoa já vê o pedido com a data calculada.
2. **Resolver sem humano:** prazo, imposto, líquido contra poupança e conceitos, com cálculo ou trecho literal da base.
3. **O humano rende mais:** o caso chega com protocolo, histórico, operação e motivo. O cliente não repete nada.

### 5. Produto rodando

Demonstração ao vivo em https://caqui.pages.dev, com a cliente Marta:

1. A home mostra "Resgate em andamento" e "Cai em 18/11/2026", com o rastreio do pedido.
2. A faixa muda de cor conforme o status: andamento, análise, atrasado, concluído e recusado.
3. Abra o orb e pergunte "Quando cai meu resgate?". A resposta traz data e fonte.
4. Escreva que alguém ligou pedindo o código. A tela "Pare agora." interrompe tudo.
5. Clique em "Falar com uma pessoa" e mostre o painel do atendente em https://caqui.pages.dev/atendente

### 6. Confiança

- Motor determinístico: modelo de linguagem nunca escreve prazo, taxa ou valor.
- Toda resposta factual cita o artigo da base ou o dado da conta.
- "Falar com uma pessoa" fica sempre visível no chat.
- Só dados sintéticos, com CPF sempre mascarado no log.

### 7. Quanto isso move

- Cerca de 4.026 horas por mês, 42% das 9.560 horas de hoje. **É hipótese:** as taxas de contenção e os 2 minutos salvos por contato ainda precisam ser validados.
- Com 5 vezes a base, é preciso cortar 68% da demanda. A solução chega a 42%, e o restante precisa vir de outras frentes.

### 8. Onde a IA errou

- A IA escreveu as regras depois de ler as frases da amostra e chegou a 40/40 no teste oficial e 20/20 em golpe. Parecia pronto.
- Um teste cego, escrito sem acesso ao código, deu 46/70. Frases como "o rapaz da caqui disse que é só falar os 6 números" caíam em "não entendi".
- Como percebi: testando com frases novas, e não com as que a IA já tinha visto.
- A nota limpa de frases novas é **37/50**, com zero falso alarme nas 10 frases inocentes.
- Próximo passo: um classificador com modelo de linguagem, porque regra por palavra não generaliza.

### 9. Como usei IA

- Claude Code em leitura do case, spec, código, testes e interface.
- Subagentes escreveram os testes cegos sem acesso ao código.
- Hook de commit barra CPF sem máscara e chave de API.
- Verificado na mão: leitura das 40 respostas, valores conferidos centavo a centavo e o fluxo na tela.

### 10. Design

UI e UX por Renan Chaves.

- Celular primeiro, e no desktop a home vira duas colunas com tabela de produtos.
- A cada versão, o que não ajudava a decisão do momento saiu da tela.
- Design system público, em código, com telas reais: https://caqui.pages.dev/design-system

### 11. Fechamento

**Quem pergunta onde está o dinheiro quer uma data, a fonte e uma pessoa por perto.**

https://caqui.pages.dev

## Prints sugeridos

Capture direto do site: home no desktop, home no celular, faixas por status, chat com resposta, tela "Pare agora." e painel do atendente.
