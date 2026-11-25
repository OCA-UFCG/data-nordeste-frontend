/**
 * Testes da saída de consultar_sql que rodam SQL de verdade no tabelão
 * (processo filho). Rode npm run tabelao antes.
 */
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { consultarSql } from "../ferramentas/consultar.ts";
import { encerrarFerramentas } from "../ferramentas/sql.ts";

after(() => encerrarFerramentas());

test("série com mais de 60 períodos sai sem gráfico, com o resumo da série inteira (rodada c7-todas, SE02)", async () => {
  const sql = "SELECT periodo AS rotulo, valor FROM valores WHERE indicador='area_em_seca' AND territorio='nordeste' ORDER BY periodo";
  const args = { sql, grafico: { tipo: "serie", titulo: "Área em seca", unidade: "% da área" } } as never;
  const saida = String(await consultarSql.executar(args, {} as never));
  assert.match(saida, /^periodo \| valor/);
  assert.match(saida, /saiu SEM gráfico: 80 períodos/);
  assert.match(saida, /Resumo calculado/);
  // O mínimo da série inteira (jan/2023, 2,4%) tem de estar no resumo.
  assert.match(saida, /2023-01/);
});

test("ranking com o mesmo nome em várias barras sai sem gráfico (conversa fe633356)", async () => {
  const sql =
    "SELECT t.nome AS rotulo, v.valor FROM valores v JOIN territorios t ON t.codigo = v.territorio WHERE v.indicador='populacao' AND v.sexo='total' AND v.cor_raca='total' AND v.faixa_etaria='total' AND v.territorio IN ('2504009','2604106') AND v.periodo IN ('2000','2010','2022') ORDER BY v.valor DESC";
  const args = { sql, grafico: { tipo: "ranking", titulo: "População", unidade: "pessoas" } } as never;
  const saida = String(await consultarSql.executar(args, {} as never));
  // Sem o cabeçalho "rotulo | valor" a página não desenha o gráfico.
  assert.match(saida, /^item \| valor\nCampina Grande \| /);
  assert.match(saida, /saiu SEM gráfico\. No ranking, cada barra precisa de um rótulo diferente, e "Campina Grande"/);
});

test("ranking com o período no rótulo continua com gráfico", async () => {
  const sql =
    "SELECT t.nome || ' (' || v.periodo || ')' AS rotulo, v.valor FROM valores v JOIN territorios t ON t.codigo = v.territorio WHERE v.indicador='populacao' AND v.sexo='total' AND v.cor_raca='total' AND v.faixa_etaria='total' AND v.territorio IN ('2504009','2604106') AND v.periodo IN ('2000','2010','2022') ORDER BY v.valor DESC";
  const args = { sql, grafico: { tipo: "ranking", titulo: "População", unidade: "pessoas" } } as never;
  const saida = String(await consultarSql.executar(args, {} as never));
  assert.match(saida, /^rotulo \| valor\nCampina Grande \(2022\) \| /);
});

test("consulta sem grafico com coluna rotulo não vira gráfico nem mistura séries (PS36, c13-todas)", async () => {
  const sql =
    "SELECT periodo AS rotulo, valor FROM valores WHERE indicador='pib' AND territorio IN ('2910800','2933307') AND periodo IN ('2013','2023') AND sexo='total' AND cor_raca='total' AND faixa_etaria='total' ORDER BY territorio, periodo";
  const saida = String(await consultarSql.executar({ sql } as never, {} as never));
  assert.match(saida, /^item \| valor\n2013 \| /);
  assert.doesNotMatch(saida, /Resumo calculado/);
});
