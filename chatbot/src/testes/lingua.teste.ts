/**
 * Testes da conferência de língua (npm run testar). Não leem o tabelão.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { linguaDa, respostaNaLinguaErrada } from "../chat/lingua.ts";

test("pergunta em espanhol respondida em português é acusada (rodada c4-v0, ES01)", () => {
  const pergunta = "¿Cuál es la población de Recife?";
  assert.equal(linguaDa(pergunta), "es");
  assert.equal(
    respostaNaLinguaErrada(pergunta, "La população de Recife (PE) é de **1.488.920 pessoas**, segundo o Censo de 2022. Ou seja, a população caiu entre 2010 e 2022."),
    "es",
  );
  assert.equal(
    respostaNaLinguaErrada(pergunta, "La población de Recife (PE) es de **1.488.920 habitantes**, según el Censo Demográfico de 2022 (IBGE)."),
    null,
  );
});

test("resposta em inglês com nome de fonte em português passa", () => {
  const pergunta = "What was the infant mortality rate in Recife in 2024?";
  assert.equal(
    respostaNaLinguaErrada(pergunta, "The infant mortality rate in Recife (PE) was 11.85 per 1,000 live births in 2024, according to SIM e Sinasc (DATASUS)."),
    null,
  );
});

test("pergunta em português e resposta só com número não são acusadas", () => {
  assert.equal(respostaNaLinguaErrada("Qual a população de Natal?", "A população de Natal é de 751.300 pessoas."), null);
  assert.equal(respostaNaLinguaErrada("What is the population of Natal?", "751,300 (2022 Census)."), null);
});
