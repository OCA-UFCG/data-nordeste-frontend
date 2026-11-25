/**
 * Testes da volta da revisão das frases (npm run testar). Não leem o tabelão.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { limparResposta, respostaDaRevisao } from "../chat/acabamento.ts";

const CORRIGIDA =
  "Os municípios com mais cisternas não são, em geral, os de pior mortalidade infantil.";

test("comentário do revisor antes da marca não chega à pessoa (PX16, c12-todas)", () => {
  const volta = `Não encontrei erro que exija reescrever. Ajustei três pontos para ficarem mais precisos:

- Tirei a justificativa para usar 2024, que não estava em nenhuma saída.

Não somei nem comparei nada além do que as consultas trouxeram.

RESPOSTA CORRIGIDA:

${CORRIGIDA}`;
  assert.equal(respostaDaRevisao(volta), CORRIGIDA);
});

test("a marca vale com negrito ou título em markdown", () => {
  assert.equal(respostaDaRevisao(`**RESPOSTA CORRIGIDA:**\n${CORRIGIDA}`), CORRIGIDA);
  assert.equal(respostaDaRevisao(`## Resposta corrigida:\n\n${CORRIGIDA}`), CORRIGIDA);
});

test("OK, texto sem marca e marca sem resposta ficam com a resposta de antes", () => {
  assert.equal(respostaDaRevisao("OK"), null);
  assert.equal(
    respostaDaRevisao(`Não encontrei erro que exija reescrever. Ajustei três pontos:\n\n${CORRIGIDA}`),
    null,
  );
  assert.equal(respostaDaRevisao("Achei um erro.\nRESPOSTA CORRIGIDA:\n"), null);
});

test("a marca citada no meio de uma frase não conta", () => {
  assert.equal(respostaDaRevisao(`Escrevo abaixo a RESPOSTA CORRIGIDA: ${CORRIGIDA}`), null);
});

test("link de painel que veio de conteudo_do_portal fica no texto; os outros viram nome (UR22, c13)", () => {
  const pib = "https://datanordeste.sudene.gov.br/data-panel/pib";
  const aridez = "https://datanordeste.sudene.gov.br/data-panel/aridez";
  const texto = `Painéis: [PIB](${pib}) e [Aridez](${aridez}).\n\n[Ver o painel](${pib})`;
  assert.equal(limparResposta(texto).resposta, "Painéis: PIB e Aridez.");
  assert.equal(limparResposta(texto, new Set([pib])).resposta, `Painéis: [PIB](${pib}) e Aridez.\n\n[Ver o painel](${pib})`);
});
