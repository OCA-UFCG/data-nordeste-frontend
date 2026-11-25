/**
 * Testes do que o chat diz quando a Anthropic não responde (npm run testar).
 * Os erros são os do próprio SDK, montados sem rede.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { classificarFalha, criarDisponibilidade, INDISPONIVEL, mensagemDaFalha } from "../chat/disponibilidade.ts";

function erroDaApi(status: number, mensagem: string) {
  return Anthropic.APIError.generate(status, { error: { type: "x", message: mensagem } }, mensagem, new Headers());
}

test("chave recusada e crédito esgotado viram 'indisponível', sem falar em API", () => {
  const chave = classificarFalha(erroDaApi(401, "invalid x-api-key"));
  const credito = classificarFalha(erroDaApi(400, "Your credit balance is too low to access the Anthropic API."));
  assert.deepEqual([chave.tipo, chave.duradoura], ["chave_recusada", true]);
  assert.deepEqual([credito.tipo, credito.duradoura], ["credito_acabou", true]);
  assert.equal(mensagemDaFalha(credito), INDISPONIVEL);
  assert.doesNotMatch(mensagemDaFalha(chave), /API|chave|\d{3}/);
});

test("sobrecarga e queda passageiras não travam o chat", () => {
  assert.equal(classificarFalha(erroDaApi(529, "Overloaded")).tipo, "fora_do_ar");
  assert.equal(classificarFalha(erroDaApi(429, "rate limited")).tipo, "muitos_pedidos");
  assert.equal(classificarFalha(new Anthropic.APIConnectionError({ message: "Connection error." })).tipo, "fora_do_ar");
  assert.equal(classificarFalha(erroDaApi(400, "messages: roles must alternate")).tipo, "inesperada");
});

test("depois de uma falha duradoura recusa por 10 minutos e depois tenta de novo", () => {
  let agora = 0;
  const d = criarDisponibilidade(() => agora);
  d.registrar(classificarFalha(erroDaApi(529, "Overloaded")));
  assert.equal(d.recusa(), null);
  d.registrar(classificarFalha(erroDaApi(401, "invalid x-api-key")));
  assert.equal(d.recusa(), INDISPONIVEL);
  assert.deepEqual(d.estado(), { disponivel: false, motivo: "chave_recusada" });
  agora = 10 * 60_000;
  assert.equal(d.recusa(), null);
});
