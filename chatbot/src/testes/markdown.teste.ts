/**
 * Testes do markdown das respostas (npm run testar): o texto vem do modelo e a
 * página o põe em innerHTML, então nada dele pode virar código.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Marked } from "marked";
import { configurarMarkdown } from "../chat/pagina/markdown.js";

function renderizar(texto: string): string {
  const m = new Marked();
  configurarMarkdown(m);

  return m.parse(texto) as string;
}

test("HTML cru na resposta aparece como texto", () => {
  const html = renderizar("Veja <img src=x onerror=alert(1)> e <script>alert(1)</script>");
  assert.doesNotMatch(html, /<img|<script/);
  assert.match(html, /&lt;img/);
});

test("link com javascript: vira texto; http(s) e relativo continuam link", () => {
  assert.equal(renderizar("[clique](javascript:alert(1))").trim(), "<p>clique</p>");
  assert.equal(renderizar("[x](JavaScript:alert(1))").trim(), "<p>x</p>");
  assert.equal(renderizar("[x](data:text/html,oi)").trim(), "<p>x</p>");
  assert.match(renderizar("[o painel](https://datanordeste.sudene.gov.br/data-panel/pib)"), /<a href="https:/);
  assert.match(renderizar("[o painel](/data-panel/pib)"), /<a href="\/data-panel\/pib"/);
});

test("imagem vira o texto alternativo, sem carregar nada", () => {
  assert.equal(renderizar("![gráfico](https://exemplo.com/x.png)").trim(), "<p>gráfico</p>");
  assert.doesNotMatch(renderizar("![x](javascript:alert(1))"), /<img/);
});
