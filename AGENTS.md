# Atendimento Caqui: instruções do projeto

Leia `SPEC.md` antes de mudar comportamento. Decisão nova entra em "Decisões" antes do código.

- O motor em `src/` é determinístico. Modelo de linguagem nunca escreve prazo, taxa ou valor.
- Toda resposta factual cita o artigo da base ou o dado da conta. KB-007 fica fora do índice.
- O id do cliente vem da sessão, nunca do texto da conversa.
- Log só com protocolo, regra, motivo e ação. CPF sempre mascarado.
- Todo valor em dinheiro usa `--color-ink`, o marrom escuro da marca, nunca vermelho ou cinza.
- Front-end segue `DESIGN.md` e os tokens de `public/tokens.css`.
- Mudou tela, botão ou movimento: atualize `public/design-system.html` no mesmo commit.
- Só dados sintéticos. Nenhum segredo no repositório.
- Regra nova vira teste em `test/motor.test.mjs`.
- Pronto é `npm test` e `npm run perguntas` passando, com as respostas lidas.
- Não reporte nota de `test/cego.jsonl` ou `test/cego2.jsonl` como medida: as duas rodadas já foram usadas. Medir de novo pede frases novas de quem não viu o código.

Depois de clonar: `npm run guardas`, que liga o hook de `.githooks/`.
