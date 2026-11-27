/** Leitura do tabelão para o cache (aquecer.ts). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { lerInteiro } from "../chat/aquecer.ts";

test("lê o arquivo inteiro, em pedaços, e conta os bytes", async () => {
  const arquivo = path.join(mkdtempSync(path.join(tmpdir(), "aquecer-")), "tabelao.sqlite");
  writeFileSync(arquivo, Buffer.alloc(9 * 1024 * 1024 + 7));
  assert.equal(await lerInteiro(arquivo), 9 * 1024 * 1024 + 7);
});

test("arquivo que não existe vira erro, não trava", async () => {
  await assert.rejects(lerInteiro("/nao/existe/tabelao.sqlite"), /ENOENT/);
});
