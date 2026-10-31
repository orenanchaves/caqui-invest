# Design system Caqui

Fonte única do front-end: [public/tokens.css](public/tokens.css), importado por [public/estilo.css](public/estilo.css). Referência visual: `/design-system`.

Para implementar, leia [PARA-DEVS.md](PARA-DEVS.md). Os tokens em JSON estão em [design-system/tokens.json](design-system/tokens.json).

## Como usar

Inclua `estilo.css` na página e use os tokens. Cor, fonte e raio nunca são escritos direto em componente.

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap">
<link rel="stylesheet" href="estilo.css">
```

## Regras

- Todo valor em dinheiro usa `--color-ink`, o marrom escuro. Nunca vermelho ou cinza. Sobre o fundo escuro do topo, usa o creme.
- Texto sobre cor é sempre escuro. Laranja suave é ação, e o tom claro `--color-destaque` marca o pedido em andamento. O laranja forte `#EF7F2E` fica só no logo.
- Vermelho, ciano, âmbar e o orb seguem assim: vermelho é golpe e marca, ciano é a etapa atual, âmbar é a borda da caixinha, o orb é marrom com raios em laranja suave.
- Azul só em foco e sublinhado, porque texto azul não passa no contraste sobre o creme.
- Fonte Proxima Nova, com Montserrat de reserva. A Proxima é licenciada e não vai para o repositório.
- Raio `--radius`, de 14px. Círculo só em orb, avatar, atalho e marco do rastreio.
- O logo aparece na abertura e na barra do desktop. No celular, depois da abertura, fica só o orb. Abertura: as sementes giram no centro e deslizam para revelar o nome. Na interface fica o texto "Caqui".
- Ações importantes (falar com uma pessoa, reclamar, encerrar, golpe e bloqueio) mostram as sementes em looping por 1 segundo.
- O chat se chama caquIA, sempre com essa grafia.
- Ícones em linha, de uma cor, com `currentColor` ou máscara. Nada que imite marca real.

## Layout no desktop

A partir de 60rem, a home tem barra no topo com busca, menu e perfil; faixa de status de ponta a ponta; saldo, conta e tabela de produtos à esquerda; cartões de informação à direita; e rodapé com suspeita de golpe. A busca abre a caquIA com a pergunta. O celular segue em coluna, com a barra embaixo.

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
| Pergunta sugerida | `.chip` | Sempre uma embaixo da outra. Envia a pergunta ao motor. Tom claro ao passar o mouse, laranja suave ao tocar e `.escolhido` depois |
| Atalho | `.atalho` | Quatro por linha |
| Caixinha | `.quadro` | Ficam lado a lado, e a aberta alarga e empurra as outras |
| Faixa de demonstração | `.demo-faixa` | Ferramenta de teste, em azul, fora do app. Abre para trocar cliente e horário |
| Extrato | `.lista-extrato` | Página própria, fora do chat. No desktop usa a mesma barra e o mesmo rodapé da home |
| Menu inferior | `.menu-base` | Início, Portfólio, Extrato e o orb, sempre visível |
| Cor por status | `data-situacao` | Andamento laranja suave, análise rosa, atrasado laranja forte, concluído creme, recusado salmão. Sempre com botão de fechar |
| Aviso de golpe | `.pare` | Tela inteira "Pare agora." quando a caquIA detecta golpe, sem logo |
| Apresentação | `apresentacao.html` | Slides em código com os tokens do design system. Setas do teclado no desktop, rolagem no celular |
| Configurações | `configuracoes.html` | Abre pelo perfil: nome, valores ocultos e forma de ver. No desktop usa a mesma barra e o mesmo rodapé da home |
| Formas de ver | `.vista-seletor` | Ao lado do título: Caixinhas, Lista e Gráfico, com a escolha salva |
| Lista | `.linha-dinheiro` | Mostra cada investimento com o rastreio aberto |
| Pedido em destaque | `.destaque` | Faixa "Resgate em andamento" em laranja suave, logo abaixo do topo, com botão de fechar |
| Gráfico de setores | `.setores` | Carteira por classe, sempre com legenda em texto |
| Carregamento da resposta | `.pensando` | Sementes em looping na conversa até a resposta sair, por pelo menos 900ms |
| Conversa com uma pessoa | `.cartao-entrega`, `.bolha.equipe` | No mesmo chat, a passagem acontece em etapas: aviso da caquIA, "Chamando Jonas", troca suave do topo e entrada da pessoa. Cartão com espera e protocolo, aguardo com sementes e mensagens da equipe em creme forte |
| Microfone | `.microfone` | Transcreve no campo, e o cliente confere antes de enviar |
| Rastreio de entrega | `.rastreio` | Etapas `feita` e `agora`, com data em cada uma |
| Orb | `.orb` | Fica na barra de menu, pulsa e abre a caquIA. O ícone do navegador usa só as sementes |
| Chat | `.chat` | Altura total da tela: tela cheia no celular e painel à direita no desktop, com o símbolo e o nome caquIA no topo. Ao passar para a equipe, `.humano` troca símbolo, nome e fundo |
| Aviso | `.aviso` | Interrompe o fluxo em golpe |
