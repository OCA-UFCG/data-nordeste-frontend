# "Veja mais" como botão flutuante nos painéis demo

**Data:** 24/11/2026 · **Tamanho:** mudança pequena · **Aprovado por:** André (24/11)

## Intenção

O rótulo passa de "Veja mais" para **"Veja análise"** (André, 24/11).

O time preferiu o "Veja mais" como botão flutuante no canto inferior direito, em
vez da barra expansível no topo do painel. O conteúdo não muda: é o mesmo texto
gerado a partir dos filtros que a barra mostra hoje.

## Escopo

- `src/components/ProtoPanel/ProtoVejaMais.tsx`, usado por dois painéis demo:
  Perfil demográfico (`DemografiaDashboard`) e Aridez (`AridezDashboard`).
- Não entra: o "Saiba mais" (`ProtoSaibaMais`, seção abaixo do painel), os painéis
  Power BI e o texto em si (`buildDemografiaAnalise`, `buildAridezAnalise`).

## Abordagens

1. **Trocar a forma do `ProtoVejaMais`** (escolhida). Um componente, os dois
   painéis mudam juntos e a API (`analysis`, `state`) fica igual.
2. Componente novo ao lado da barra. Descartada: dois jeitos de mostrar o mesmo
   texto, e a barra deixaria de ser usada.
3. Manter a barra e acrescentar o botão. Descartada: o time pediu a troca.

## Design

- **Botão:** `fixed` no canto inferior direito, ícone `text` + "Veja análise", fundo
  na cor do painel (`--proto-accent-strong`). A barra do topo e a prévia do texto
  saem.
- **Ponto vermelho** (`UpdatedDot`) no botão quando o texto muda com o cartão
  fechado; o brilho do texto novo (`animate-proto-flash`) continua.
- **Computador:** cartão acima do botão (cabeçalho "Veja análise" + ✕, rolagem
  própria). Fecha pelo ✕, Esc ou novo clique no botão. Não fecha ao clicar fora e
  não escurece a página: a pessoa troca filtros com o cartão aberto.
- **Celular (≤ 700 px):** o botão abre a `ProtoSheet` (folha inferior já usada por
  filtros e ⓘ).
- **Visibilidade:** em toda a página do painel.
- **Estados:** carregando, erro e sem texto mostram as mensagens de hoje.

## Decisões do construtor

- Tamanho do cartão (~400 px de largura, altura máxima relativa à janela), z-index
  abaixo do tooltip (`z-[120]`) e da folha (`z-50`) — conferir sobreposição.
- O tom do painel precisa chegar ao botão `fixed` (o `style` do tom está no
  contêiner do painel; a folha usa `useProtoTone`).
- Testes: atualizar `ProtoVejaMais.test.tsx` (abrir/fechar, Esc, ponto vermelho,
  estados).
- Entrega por PR na `main`; as demos só existem no Gamma.
