# UI e UX do atendimento Caqui

UI e UX por **Renan Chaves**, para o case Hands On com IA da Avenue, em 31/10/2026.

Produto no ar: https://caqui.pages.dev
Design system: https://caqui.pages.dev/design-system
Regras completas: [DESIGN.md](DESIGN.md)

## O problema de experiência

A cliente pede um resgate e não sabe onde o dinheiro está nem quando cai. Sem essa resposta, ela procura o atendimento. Por isso a interface mostra o andamento do dinheiro antes de a pessoa precisar perguntar, e a conversa fica a um toque quando ela quiser ajuda.

## Princípios

- **Celular primeiro.** Tudo foi desenhado para 375px e depois adaptado para desktop.
- **Menos na tela.** Cada versão tirou elementos: o que não ajuda a decisão do momento sai ou fica recolhido.
- **O dinheiro manda.** Todo valor aparece em marrom escuro, nunca em vermelho ou cinza, e em creme sobre o topo escuro.
- **Cor com significado.** Ciano é a etapa atual, âmbar é a borda da caixinha, o orb é marrom, vermelho é golpe e marca.
- **Uma pessoa sempre por perto.** "Falar com uma pessoa" fica visível no topo do chat.

## Identidade

- Paleta creme e marrom, com laranja suave `#f6ac78` como acento.
- Fonte Proxima Nova, com Montserrat como alternativa.
- Logo só na abertura. Dentro do app, o símbolo das sementes aparece no orb.
- Ícones de uma cor só, sem emoji.
- Cantos de 14px. Círculo só em orb, avatar, atalho e marco do rastreio.
- Texto balanceado nas linhas e sem maiúsculas rastreadas.

## O que foi desenhado

### Abertura e espera

As sementes da marca aparecem na abertura e voltam em looping nas ações importantes, para mostrar que o sistema está trabalhando.

### Home

- Topo escuro com perfil, saldo total, opção de ocultar valores e os botões Aplicar e Resgatar.
- Faixa de pedido logo abaixo do topo, com o rastreio das etapas e botão de fechar.
- Seção "Onde está meu dinheiro" com três formas de ver: Caixinhas, Lista e Gráfico. A escolha fica salva.
- Caixinhas lado a lado que abrem empurrando as outras, com a linha do tempo do investimento.
- Atalhos e dúvidas comuns para abrir a conversa com uma pergunta pronta.

### Barra de menu

Fica fixa embaixo, com Início, Portfólio, Extrato e o orb. Primeiro o orb flutuava e podia ser arrastado. Depois entrou na própria barra, para deixar um só caminho fixo de navegação.

### Cor por status

| Status | Cor da faixa |
| --- | --- |
| Em andamento | Laranja suave |
| Em análise | Rosa |
| Atrasado | Laranja forte |
| Concluído | Creme |
| Recusado | Salmão |

Todas as faixas têm botão de fechar.

### caquIA

- O orb marrom pulsa e abre a conversa em janela.
- Perguntas sugeridas, campo "Fale aqui", microfone com transcrição e ícone de envio.
- As respostas mostram a fonte de forma recolhida.
- A entrega para uma pessoa mostra o motivo e a fila.
- "Mais opções" funciona em sanfona e vira "Menos opções" quando aberto. Ali ficam Reclamar, Encerrar, Suspeita de golpe e o horário de atendimento.

### Aviso de golpe

A tela inteira "Pare agora." interrompe a conversa quando há sinal de golpe. Ela diz o que a Caqui nunca pede, orienta o próximo passo e leva para a segurança.

### Extrato e Configurações

- Extrato em página própria, com o topo só com a seta de voltar.
- Configurações abre pelo perfil, com nome, opção de abrir com valores ocultos e forma de ver o portfólio.

### Painel do atendente

Uma tela separada mostra a fila de casos, com destaque para prioridade e segurança: https://caqui.pages.dev/atendente

### Demonstração

A barra azul separa os controles de teste do produto, fica recolhida e deixa claro que os dados são fictícios.

## Como as decisões evoluíram

| Antes | Depois | Por quê |
| --- | --- | --- |
| Tela cheia de elementos | Rodapé só quando acionado | Estava poluída |
| Laranja forte na faixa | Laranja suave | Estava gritante |
| "Suas caixinhas" | "Onde está meu dinheiro" | Responde à pergunta da pessoa |
| Saudação "Olá" | Só o nome | Menos texto na home |
| Logo em várias telas | Logo só na abertura | Limpa o topo do app |
| Orb flutuante | Orb na barra de menu | Um só caminho fixo |
| "Meu dinheiro" na barra | "Portfólio" | Nome mais curto para a navegação |
| Marca no topo do Extrato | Só a seta | Menos ruído nas telas internas |
| Mais opções sempre aberto | Sanfona | O chat fica mais limpo |

## Conferência

Cada mudança passou por conferência em celular e desktop, com medição de estouro, sobreposição, contraste e erro de JavaScript, além da leitura dos prints.
