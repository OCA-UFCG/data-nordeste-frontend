/**
 * Testes da senha da equipe e dos limites de uso (npm run testar). Não leem o tabelão.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { criarPortao } from "../chat/equipe.ts";
import { criarLimites } from "../chat/limites.ts";

const cookieDoSetCookie = (setCookie: string) => setCookie.split(";")[0];

test("senha certa dá um cookie que identifica o navegador; errada não", () => {
  const portao = criarPortao("teste-123")!;
  assert.deepEqual(portao.entrar("errada", false), { ok: false, erro: "Senha errada." });
  const r = portao.entrar("teste-123", true);
  assert.ok(r.ok);
  assert.match(r.cookie, /HttpOnly; SameSite=Lax; Path=\/; Max-Age=2592000; Secure$/);
  assert.match(String(portao.pessoa(cookieDoSetCookie(r.cookie))), /^[0-9a-f]{8}$/);
});

test("cookie adulterado, de outra senha ou vencido não vale", () => {
  let agora = Date.now();
  const portao = criarPortao("teste-123", () => agora)!;
  const r = portao.entrar("teste-123", false);
  assert.ok(r.ok);
  const cookie = cookieDoSetCookie(r.cookie);
  // Troca o último caractere da assinatura por outro, sempre diferente (com um
  // "f" fixo no id, o teste falhava 1 vez em 16: quando o id já começava com f).
  const adulterado = cookie.slice(0, -1) + (cookie.endsWith("A") ? "B" : "A");
  assert.equal(portao.pessoa(adulterado), null);
  assert.equal(criarPortao("outra-senha")!.pessoa(cookie), null);
  agora += 31 * 24 * 3600_000;
  assert.equal(portao.pessoa(cookie), null);
});

test("depois de 30 senhas erradas em um minuto, ninguém entra até o minuto passar", () => {
  let agora = Date.now();
  const portao = criarPortao("teste-123", () => agora)!;
  const jaEntrou = (portao.entrar("teste-123", false) as { cookie: string }).cookie.split(";")[0];
  for (let i = 0; i < 30; i++) portao.entrar("errada", false);
  assert.match(String((portao.entrar("teste-123", false) as { erro: string }).erro), /Muitas tentativas/);
  // Quem já tinha entrado continua: o teto vale só para a tela de senha.
  assert.ok(portao.pessoa(jaEntrou));
  agora += 61_000;
  assert.ok(portao.entrar("teste-123", false).ok);
});

test("sem senha não há portão (modo local)", () => {
  assert.equal(criarPortao(undefined), null);
  assert.equal(criarPortao(""), null);
});

test("teto mensal conta o que já está gravado e recusa ao passar de US$ 50", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "datane-limites-"));
  const agora = Date.parse("2026-11-24T15:00:00-03:00");
  const turno = (em: string, usd: number) => JSON.stringify({ tipo: "turno", em, custo_usd: usd });
  writeFileSync(
    path.join(dir, "a.jsonl"),
    [JSON.stringify({ tipo: "inicio", pessoa: "p1" }), turno("2026-11-02T12:00:00Z", 49.5), turno("2026-10-30T12:00:00Z", 99)].join("\n"),
  );
  const limites = criarLimites(dir, {}, () => agora);
  assert.equal(limites.situacao().gastoMes, 49.5);
  assert.equal(limites.recusa("p1"), null);
  limites.contarGasto(0.6);
  assert.match(String(limites.recusa("p1")), /limite de uso deste mês/);
});

test("limite de perguntas por pessoa por dia e teto diário", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "datane-limites-"));
  const limites = criarLimites(dir, { DATANE_CHAT_PERGUNTAS_POR_DIA: "2", DATANE_CHAT_TETO_DIARIO_USD: "1" });
  limites.contarPergunta("p1");
  limites.contarPergunta("p1");
  assert.match(String(limites.recusa("p1")), /chegou a 2 perguntas hoje/);
  assert.equal(limites.recusa("p2"), null);
  limites.contarGasto(1);
  assert.match(String(limites.recusa("p2")), /limite de uso de hoje/);
});
