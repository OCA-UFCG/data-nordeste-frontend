/**
 * Testes da volta da revisão das frases (npm run testar). Não leem o tabelão.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { limparResposta, respostaDaRevisao } from "../chat/acabamento.ts";
import type Anthropic from "@anthropic-ai/sdk";
import { fecharConferencia } from "../chat/motor-api.ts";

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

test("a conferência da página sai do histórico; fica a resposta que a pessoa viu (UR20)", () => {
  const mensagens: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: "Compare a população de Campina Grande com a de Caruaru" },
    { role: "assistant", content: [{ type: "tool_use", id: "t1", name: "consultar_sql", input: {} }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "419379 | 378048" }] },
    { role: "assistant", content: "Rascunho com 419.379 e 378.048." },
    { role: "user", content: "[Conferência automática da página, não é mensagem da pessoa] Releia…" },
    { role: "assistant", content: "OK" },
  ];
  fecharConferencia(mensagens, 3, "Campina Grande tinha 419.379 habitantes e Caruaru, 378.048.");
  assert.equal(mensagens.length, 4);
  assert.deepEqual(mensagens.at(-1), { role: "assistant", content: "Campina Grande tinha 419.379 habitantes e Caruaru, 378.048." });
  assert.doesNotMatch(JSON.stringify(mensagens), /Conferência|"OK"/);
});
