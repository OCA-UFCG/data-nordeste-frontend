/**
 * Testes do nome dos painéis no conteúdo do portal (npm run testar).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { nomesDosPaineis } from "../tabelao/portal.ts";

test("painel ganha o nome do post que aponta para ele, sem 'Acessar painel:'", () => {
  const nomes = nomesDosPaineis([
    { type: "data-panel", link: "https://datanordeste.sudene.gov.br/data-panel/populacaorua", title: "Acessar painel: População em situação de rua" },
    { type: "data-panel", link: "/data-panel/pib?pageName=x", title: "PIB" },
    { type: "newsletter", link: "/data-panel/idhm", title: "Boletim sobre o IDHM" },
  ]);
  assert.equal(nomes.get("populacaorua"), "População em situação de rua");
  assert.equal(nomes.get("pib"), "PIB");
  assert.equal(nomes.has("idhm"), false);
});
