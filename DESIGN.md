# Design system Caqui

Fonte única do front-end: [public/tokens.css](public/tokens.css), importado por [public/estilo.css](public/estilo.css). Referência visual: `/design-system.html`.

## Como usar

Inclua `estilo.css` na página e use os tokens. Cor, fonte e raio nunca são escritos direto em componente.

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap">
<link rel="stylesheet" href="estilo.css">
```

## Regras

- Todo valor em dinheiro usa `--color-ink`, o marrom escuro. Nunca vermelho ou cinza. Sobre o fundo escuro do topo, usa o creme.
- Texto sobre cor é sempre escuro. Laranja é ação, vermelho é golpe e marca, ciano é a etapa atual, âmbar é a borda da caixinha, amarelo é o orb.
- Azul só em foco e sublinhado, porque texto azul não passa no contraste sobre o creme.
- Fonte Proxima Nova, com Montserrat de reserva. A Proxima é licenciada e não vai para o repositório.
- Raio `--radius`, de 14px. Círculo só em orb, avatar, atalho e marco do rastreio.
- O logo aparece só na abertura: as sementes giram no centro e deslizam para revelar o nome. Na interface fica o texto "Caqui".
- Ações importantes (falar com uma pessoa, reclamar, encerrar, golpe e bloqueio) mostram as sementes em looping por 1 segundo.
- O chat se chama caquIA, sempre com essa grafia.
- Ícones em linha, de uma cor, com `currentColor` ou máscara. Nada que imite marca real.

## Layouts da tela inicial

- **Lista:** topo escuro com busca e total, faixa laranja do pedido e linhas com ícone, valor e seta.
- **Bento:** os mesmos dados em blocos de duas colunas sobre o creme forte.
- Referência em `/design-system.html#layouts`.

## Movimento e texto

- Entrada suave com `entra`: sobe 16px e aparece, em até 420ms. Respeita `prefers-reduced-motion`.
- Só `opacity` e `transform` são animados.
- Links de âncora sem sublinhado, com fundo discreto ao passar o mouse e rolagem suave.
- Títulos e textos curtos com `text-wrap: balance`, e parágrafos com `text-wrap: pretty`.

## Componentes

| Componente | Classe | Regra |
| --- | --- | --- |
| Ação principal | `.primario` | Uma por bloco |
| Ação de segurança | `.botao-forte` | Só em golpe |
| Pergunta sugerida | `.chip` | Envia a pergunta ao motor |
| Atalho | `.atalho` | Quatro por linha |
| Caixinha | `.quadro` | Ficam lado a lado, e a aberta alarga e empurra as outras |
| Faixa de demonstração | `.demo-faixa` | Ferramenta de teste, em azul, fora do app. Abre para trocar cliente e horário |
| Extrato | `.lista-extrato` | Página própria, fora do chat |
| Formas de ver | `.vista-seletor` | Ao lado do título: Caixinhas, Lista e Gráfico, com a escolha salva |
| Lista | `.linha-dinheiro` | Mostra cada investimento com o rastreio aberto |
| Pedido em destaque | `.destaque` | Primeiro pedido em aberto, em laranja, logo abaixo do topo |
| Gráfico de setores | `.setores` | Carteira por classe, sempre com legenda em texto |
| Microfone | `.microfone` | Transcreve no campo, e o cliente confere antes de enviar |
| Rastreio de entrega | `.rastreio` | Etapas `feita` e `agora`, com data em cada uma |
| Orb | `.orb` | Flutua, pulsa, pode ser arrastado e abre a caquIA. O ícone do navegador usa só as sementes |
| Chat | `.chat` | Popup no centro da tela, com o símbolo e o nome caquIA no topo. Ao passar para a equipe, `.humano` troca símbolo, nome e fundo |
| Aviso | `.aviso` | Interrompe o fluxo em golpe |
