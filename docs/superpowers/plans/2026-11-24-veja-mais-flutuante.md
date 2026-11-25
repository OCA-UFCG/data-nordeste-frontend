# "Veja mais" flutuante — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trocar a barra expansível do `ProtoVejaMais` por um botão flutuante no canto inferior direito que abre um cartão (computador) ou a folha inferior (celular), com o mesmo texto.

**Architecture:** só `ProtoVejaMais` muda; a API (`analysis`, `state`) fica igual, então `DemografiaDashboard` e `AridezDashboard` não mudam. O texto (`AnalysisText` e afins) vai para um arquivo próprio, reaproveitado pelo cartão e pela folha. O modo de abertura é decidido no clique por `matchMedia("(max-width: 700px)")`, como em `usePibYearField.ts`.

**Tech Stack:** Next.js 15 / React, Tailwind v4, Radix Dialog via `ProtoSheet`, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-24-veja-mais-flutuante-design.md`

## Global Constraints

- Rótulo do botão e título do cartão/folha: "Veja análise" (pedido do André, 24/11; o componente mantém o nome `ProtoVejaMais`). Fechar: `aria-label="Fechar"`.
- Mensagens iguais às de hoje: `NO_TEXT`, `ERROR_TEXT`, "Carregando texto…".
- Cor do botão: `bg-(--proto-accent-strong)`, texto branco. O `style` do tom já está no contêiner do painel e as variáveis CSS herdam pelo DOM, mesmo com `fixed`.
- Celular = `(max-width: 700px)`.
- Cartão não é modal: sem fundo escuro, não fecha ao clicar fora; fecha por ✕, Esc e novo clique no botão.
- Commits seguem `CONTRIBUTING.md`/commitlint, **sem** `Co-Authored-By`, e só quando o André pedir.

## Review Focus

1. Texto muda com o cartão aberto → sem ponto vermelho; o brilho (`animate-proto-flash`) aparece. (Teste existente adaptado, Task 1.)
2. Esc com o cartão aberto fecha e devolve o foco ao botão. (Teste na Task 1.)
3. Celular: clique abre a folha (`role="dialog"`), não o cartão. (Teste na Task 1, com `stubPhoneMedia` de `protoBrowserFakes.ts` ou `vi.stubGlobal("matchMedia", …)`.)
4. Botão sobre o rodapé/relacionados no fim da página e sobre o tooltip dos gráficos: conferir no navegador (Task 2); z-index do botão/cartão `z-40`, abaixo da folha (`z-50`) e do tooltip (`z-[120]`).
5. Aridez sem dados (`showEmpty`) não renderiza o componente → botão some; Perfil sem dados mostra o botão com `NO_TEXT`. Comportamento herdado, conferir no navegador.

---

### Task 1: `ProtoVejaMais` vira botão flutuante

**Files:**
- Create: `src/components/ProtoPanel/ProtoVejaMaisText.tsx` (move `NO_TEXT`, `ERROR_TEXT`, `analysisKey`, `AnalysisSkeleton`, `AnalysisList`, `AnalysisText` sem mudar o markup; exporta `AnalysisText` e `analysisKey`)
- Modify: `src/components/ProtoPanel/ProtoVejaMais.tsx` (substitui a `section` da barra; remove `previewOf`)
- Test: `src/components/ProtoPanel/ProtoVejaMais.test.tsx`

**Interfaces:**
- Produces: `ProtoVejaMais({ analysis, state })` — mesma assinatura; `AnalysisText({ state, analysis, flash })`, `analysisKey(analysis)` em `ProtoVejaMaisText.tsx`.

- [ ] **Step 1: Adaptar os testes.** `toggle()` continua `getByRole("button", { name: /Veja análise/ })`. Mudanças:
  - "abre e fecha o texto pelo botão": `aria-expanded` false → clique → true e rodapé visível → clique → false e rodapé fora do documento.
  - novo "fecha pelo ✕ e pelo Esc": abre, `fireEvent.click(getByRole("button", { name: "Fechar" }))` → `aria-expanded="false"`; abre de novo, `fireEvent.keyDown(document, { key: "Escape" })` → fechado e `document.activeElement === toggle()`.
  - novo "no celular abre a folha": `matchMedia` falso-verdadeiro para `(max-width: 700px)`; clique → `getByRole("dialog", { name: "Veja análise" })` contém o rodapé.
  - "mostra o erro": abrir antes de procurar `ERROR_TEXT` (não há mais prévia na tela fechada).
  - "lista os itens": abrir antes de procurar os `listitem`.
  - os dois testes do ponto vermelho ficam como estão.
- [ ] **Step 2:** `npx vitest run src/components/ProtoPanel/ProtoVejaMais.test.tsx` → falham os de ✕/Esc, celular, erro e itens.
- [ ] **Step 3: Implementar.** Estado `mode: "closed" | "card" | "sheet"`; `toggle()` faz `setSeen(current)` e escolhe `sheet` quando `matchMedia(PHONE_QUERY).matches`, senão `card`. Botão: `fixed right-6 bottom-6 z-40` (`max-[700px]:right-4 bottom-4`), pílula `rounded-full`, `ProtoIcon name="text"`, "Veja análise" + `UpdatedDot`, `aria-expanded={mode !== "closed"}`, `aria-controls` do cartão, sombra `CARD_SHADOW`. Cartão: `fixed right-6 bottom-[84px] z-40 w-[400px] max-w-[calc(100vw-32px)] max-h-[min(60vh,560px)]`, cabeçalho "Veja análise" + ✕ (`ProtoIcon name="close"`, `FOCUS_RING`), corpo com `overflow-auto` e `<AnalysisText …/>`; `role="dialog"` com `aria-labelledby` no título, sem `aria-modal`. Esc: `useEffect` com `keydown` no `document` só enquanto `mode === "card"`; ao fechar, foco volta ao botão (`ref`). Folha: `<ProtoSheet open={mode === "sheet"} onOpenChange={(o) => !o && close()} title="Veja análise">` com `<AnalysisText …/>`. Atualizar o docstring e trocar o `INTENTIONAL:` da barra por um que registre a decisão do time (24/11/2026) pelo botão flutuante.
- [ ] **Step 4:** mesmo comando do Step 2 → todos passam.
- [ ] **Step 5:** `npm run lint` e `npx vitest run src/components` → sem erros.

### Task 2: Conferir no navegador e validar

**Files:** nenhum (só ajustes de classe na Task 1 se algo sobrepor).

- [ ] **Step 1:** `npm run dev` com `DEMOS_HABILITADAS=1` e o `.env` do Gamma (data DB pela VPN); abrir `/demo/perfil-demografico` e `/demo/aridez` em 1440 px e 390 px.
- [ ] **Step 2:** conferir os itens 1, 4 e 5 da Review Focus; trocar filtro com o cartão aberto; tirar print de cada painel nas duas larguras.
- [ ] **Step 3:** `npm run build` → sucesso (tipos).
- [ ] **Step 4:** resumo em formato de mensagem de commit/PR para o André; commit e PR só quando ele pedir.
