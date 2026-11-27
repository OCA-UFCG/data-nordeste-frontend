/**
 * Testes das partes que não dependem do modelo (npm run testar). Leem o
 * tabelão de dados/datane.sqlite; rode npm run tabelao antes.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buscarTerritorios, separarUf } from "../ferramentas/territorio.ts";
import { notasDaConsulta, notasDeAnoAntigo, notasDosCodigos, notasDeClassesDeSeca, notasDeIdsDesconhecidos, notasDeMetas, notasDeRankingDeTaxa, notasDeRessalvas, notasDosRecortes, periodosPorIndicador } from "../ferramentas/notas.ts";
import { validarSql } from "../ferramentas/sql.ts";
import { extremosPorColuna, resumoCalculado } from "../ferramentas/resumo.ts";
import { paineisDasConsultas } from "../ferramentas/catalogo.ts";
import { textoDoHtml } from "../tabelao/portal.ts";
import { buscarNoPortal } from "../ferramentas/portal.ts";
import { CONSULTAS, INDICADORES } from "../tabelao/indicadores.ts";
import { RODAPE, numeroParaOModelo, tabela } from "../ferramentas/banco.ts";
import { numerosSemFonte } from "../conferir-numeros.ts";

test("busca acha os três Santa Luzia e pede a UF", () => {
  const saida = buscarTerritorios("Santa Luzia");
  for (const uf of ["BA", "MA", "PB"]) assert.match(saida, new RegExp(`\\| ${uf} \\|`));
  assert.match(saida, /3 municípios com esse nome/);
});

test("busca aceita UF no fim, erro de digitação e a outra grafia", () => {
  assert.match(buscarTerritorios("Patos - PB"), /2510808/);
  assert.match(buscarTerritorios("cajazieras"), /Cajazeiras/);
  assert.match(buscarTerritorios("Açu"), /2400208/);
  assert.deepEqual(separarUf("Sousa (PB)"), { nome: "Sousa", uf: "PB" });
});

test("Minas Gerais vira a parte na área da Sudene, com aviso", () => {
  const saida = buscarTerritorios("Minas Gerais");
  assert.match(saida, /MG_SUDENE/);
  assert.match(saida, /não é do estado inteiro/);
});

test("recorte que não existe explica o que há", () => {
  assert.match(buscarTerritorios("Zona da Mata Mineira"), /Não tem bairros|mesorregiões/);
});

test("id de indicador errado sugere o certo", () => {
  const [nota] = notasDeIdsDesconhecidos("SELECT valor FROM valores WHERE indicador='mortalidade' AND periodo='2024'");
  assert.match(nota, /'mortalidade_infantil'/);
  assert.equal(notasDeIdsDesconhecidos("SELECT 1 FROM valores WHERE indicador='pib' AND periodo='2023'").length, 0);
});

test("recorte sem filtro avisa que a soma dobraria", () => {
  const notas = notasDosRecortes("SELECT SUM(valor) FROM valores WHERE indicador='populacao' AND periodo='2022' AND territorio='PB'");
  assert.equal(notas.length, 3);
  assert.ok(notas.every((n) => /'total'/.test(n)));
  const vacina = notasDosRecortes("SELECT valor FROM valores WHERE indicador='cobertura_vacinal' AND territorio='PB'");
  assert.match(vacina[0], /não há total/);
});

test("resultado com município e estado misturados avisa", () => {
  const notas = notasDaConsulta("SELECT territorio, valor FROM valores WHERE indicador='pib' AND periodo='2023' ORDER BY valor DESC", ["territorio", "valor"], [
    { territorio: "BA", valor: 1 },
    { territorio: "2927408", valor: 2 },
  ], false);
  assert.match(notas, /mistura municípios/);
});

test("SQL: só SELECT/WITH, uma consulta", () => {
  assert.equal(validarSql("select 1"), null);
  assert.match(validarSql("DELETE FROM valores") ?? "", /SELECT ou WITH/);
  assert.match(validarSql("select 1; select 2") ?? "", /uma consulta/);
  assert.match(validarSql("SELECT 1 FROM valores ATTACH 'outro.db' AS b") ?? "", /não é permitido/);
});

test("resumo de ranking não traz média simples; IDHM mantém 3 casas", () => {
  const r = resumoCalculado("ranking", [0.682, 0.556, 0.55, 0.6].map((v, i) => ({ rotulo: `m${i}`, valor: v })));
  assert.doesNotMatch(r, /média simples/);
  assert.match(r, /maior 0,682/);
});

test("botão de painel sai dos indicadores consultados", () => {
  const p = paineisDasConsultas(["SELECT valor FROM valores WHERE indicador='mortalidade_infantil'"]);
  assert.equal(p[0]?.url, "https://datanordeste.sudene.gov.br/data-panel/mortalidade");
  assert.match(paineisDasConsultas(["SELECT valor FROM valores WHERE indicador='monitor_secas'"])[0].url, /monitordesecas\.ana\.gov\.br/);
});

test("dois painéis do mesmo tema saem com nomes diferentes (conversa fe633356)", () => {
  const p = paineisDasConsultas(["SELECT valor FROM valores WHERE indicador IN ('esgoto_rede_geral', 'lixo_coletado')"]);
  assert.deepEqual(
    p.map((x) => x.titulo),
    ["Painel de esgotamento sanitário no Data Nordeste", "Painel de coleta de lixo no Data Nordeste"],
  );
});

test("HTML do Zenodo vira texto com acento", () => {
  assert.equal(textoDoHtml("<p>Delimita&ccedil;&atilde;o do Semi&aacute;rido&nbsp;&#8211; 2021</p>"), "Delimitação do Semiárido – 2021");
});

test("catálogo: toda linha usa só medidas da consulta e toda razão tem denominador", () => {
  for (const ind of INDICADORES) {
    const c = CONSULTAS.find((x) => x.id === ind.consulta);
    assert.ok(c, `indicador ${ind.id}: consulta ${ind.consulta} não existe`);
    for (const l of ind.linhas) {
      const nomes = `${l.numerador} ${l.denominador ?? ""}`.match(/[a-z_][a-z0-9_]*/g) ?? [];
      for (const n of nomes) assert.ok(c.medidas.includes(n), `indicador ${ind.id}: "${n}" não é medida da consulta ${c.id}`);
      if (ind.agregacao === "razao") assert.ok(l.denominador, `indicador ${ind.id}: razão sem denominador`);
    }
  }
});

test("cidade fora da área que só dá nome a região parcial é avisada (rodada c3-v0, TE02)", () => {
  assert.match(buscarTerritorios("Belo Horizonte"), /não há município com esse nome na área da Sudene/);
  assert.doesNotMatch(buscarTerritorios("Mossoró"), /não há município com esse nome/);
  assert.doesNotMatch(buscarTerritorios("Montes Claros"), /não há município com esse nome/);
});

test("ressalvas de indicador frágil e de recorte de nome enganoso (rodada c3-v0, IN01 e TE05)", () => {
  assert.match(notasDeRessalvas("SELECT valor FROM valores WHERE indicador='criancas_situacao_rua' AND territorio='2304400'").join(), /INC-18/);
  assert.match(notasDeRessalvas("SELECT valor FROM valores WHERE indicador='taxa_analfabetismo' AND territorio='caatinga'").join(), /não a área do bioma/);
  assert.match(notasDeRessalvas("SELECT valor FROM valores WHERE indicador='pib' AND territorio='MG_SUDENE'").join(), /249 de 853/);
  assert.deepEqual(notasDeRessalvas("SELECT valor FROM valores WHERE indicador='pessoas_situacao_rua' AND territorio='PB'"), []);
  // Setores (INC-8): uma nota só, mesmo com os dois indicadores de setor (rodada c3-v1, IN09).
  assert.equal(notasDeRessalvas("SELECT valor FROM valores WHERE indicador IN ('valor_adicionado','participacao_setor')").length, 1);
  assert.match(notasDeRessalvas("SELECT valor FROM valores WHERE indicador='participacao_setor'").join(), /INC-8/);
});

test("resumo conta os empates por extenso e com o valor exato (rodada v2, SC02)", () => {
  const pontos = [100, 99.96, 100, 100, 100, 50].map((v, i) => ({ rotulo: `m${i}`, valor: v }));
  assert.match(resumoCalculado("ranking", pontos), /maior 100 \(4 com esse valor: m0, m2, m3 e mais 1\)/);
});

test("resumo junta no empate o valor com resíduo de ponto flutuante (seca na PB, gamma 25/11/2026)", () => {
  const pontos = [100.00000000000001, 100, 100, 100.00000000000001, 100, 0].map((v, i) => ({ rotulo: `m${i}`, valor: v }));
  assert.match(resumoCalculado("ranking", pontos), /maior 100 \(5 com esse valor:/);
});

test("saídas de ferramenta não mostram o nome interno da base (rodadas v4 e c3-v1)", () => {
  assert.doesNotMatch(RODAPE, /tabel[ãa]o/i);
  assert.match(RODAPE, /fonte original/);
});

test("ranking de taxa por município pede o filtro na primeira frase (rodada c6-v0, DF03)", () => {
  const ranking = "SELECT t.nome, v.valor FROM valores v JOIN territorios t ON t.codigo=v.territorio WHERE v.indicador='mortalidade_infantil' AND v.periodo='2025' AND t.tipo='municipio' ORDER BY v.valor DESC LIMIT 10";
  assert.match(notasDeRankingDeTaxa(ranking).join(), /primeira frase diz o filtro/);
  assert.deepEqual(notasDeRankingDeTaxa("SELECT valor FROM valores WHERE indicador='mortalidade_infantil' AND territorio='PB'"), []);
  assert.deepEqual(notasDeRankingDeTaxa(ranking.replace("mortalidade_infantil", "populacao")), []);
});

test("cobertura vacinal traz a meta de cada vacina da saída (rodada c6-todas, V02)", () => {
  const sql = "SELECT categoria, valor FROM valores WHERE indicador='cobertura_vacinal' AND territorio='PB' AND periodo='2025'";
  const [nota] = notasDeMetas(sql, [{ categoria: "Tríplice Viral - 2° Dose", valor: 80 }, { categoria: "BCG", valor: 99 }, { categoria: "Hepatite B (<= 1 dia)", valor: 70 }]);
  assert.match(nota, /Tríplice Viral - 2° Dose: 95%/);
  assert.match(nota, /BCG: 90%/);
  assert.match(nota, /Hepatite B \(<= 1 dia\): sem meta definida/);
  assert.deepEqual(notasDeMetas("SELECT valor FROM valores WHERE indicador='populacao'", [{ categoria: "BCG" }]), []);
});

test("\"norte de Minas\" traz os dois sentidos e pede para dizer qual (rodada c9-v0, PS06)", () => {
  const saida = buscarTerritorios("Norte de Minas", "MG");
  assert.match(saida, /MG_SUDENE/);
  assert.match(saida, /rgint_3102/);
  assert.match(saida, /dois sentidos/);
});

test("número com 3 casas não parece milhar (c9-todas, DF01)", () => {
  assert.equal(numeroParaOModelo(591.656), "591.6560");
  assert.equal(numeroParaOModelo(13.11), "13.11");
  assert.equal(numeroParaOModelo(0.72), "0.72");
  assert.equal(numeroParaOModelo(0.123), "0.123");
  assert.equal(numeroParaOModelo(30780.613), "30780.613");
  const saida = tabela(["nome", "area_km2"], [{ nome: "Campina Grande", area_km2: 591.656 }]);
  const fontes = { ferramentas: [saida], outras: [] };
  assert.deepEqual(numerosSemFonte("A área é de 591,7 km².", fontes), []);
  assert.deepEqual(numerosSemFonte("A área é de 591,7 mil km².", fontes), ["591,7"]);
});

test("razão \"1 em cada N\" precisa sair das saídas (c11-v0, PX09)", () => {
  const so60 = { ferramentas: ["valor\n10100"], outras: [] };
  assert.deepEqual(numerosSemFonte("São 10.100 idosos, cerca de 1 em cada 8 habitantes.", so60), ["8"]);
  const comTotal = { ferramentas: ["valor\n10100", "valor\n63472"], outras: [] };
  assert.deepEqual(numerosSemFonte("São 10.100 idosos, cerca de 1 em cada 6 habitantes, de 63.472.", comTotal), []);
});

test("busca só com 'painel' lista os painéis em vez de voltar vazia (conversa fe633356)", () => {
  const saida = buscarNoPortal("painel");
  assert.doesNotMatch(saida, /Nada no portal/);
  assert.match(saida, /itens do tipo painel/);
  assert.match(saida, /data-panel\/aridez/);
});

test("busca sem assunto nem tipo diz quantos itens há de cada tipo", () => {
  assert.match(buscarNoPortal("dados"), /O portal tem \d+ painel, \d+ boletim/);
});

test("nome antigo acha o município de hoje e avisa da troca (c17, NA03)", () => {
  const saida = buscarTerritorios("Santarém", "PB");
  assert.match(saida, /2513653/);
  assert.match(saida, /"Santarém" é o nome antigo de Joca Claudino \(PB\), trocado em 2011/);
  assert.match(buscarTerritorios("Augusto Severo"), /Campo Grande.*2401305|2401305/s);
  assert.match(buscarTerritorios("itapage"), /2306306/);
});

test("nome antigo que é o nome atual de outro município traz os dois (c17, NA03)", () => {
  const saida = buscarTerritorios("Presidente Juscelino");
  assert.match(saida, /\| MA \|/);
  assert.match(saida, /2410306/);
  assert.match(saida, /nome antigo de Serra Caiada \(RN\)/);
  assert.doesNotMatch(buscarTerritorios("Santa Luzia"), /nome antigo/);
});

test("\"Seridó\" fala primeiro da região, não só do nome antigo de São Vicente do Seridó", () => {
  const saida = buscarTerritorios("Seridó");
  assert.match(saida, /região do Seridó/);
  assert.doesNotMatch(saida, /É o mesmo município/);
});

test("classes do Monitor de Secas pedem os totais prontos, não a soma (c17-v1, TR02)", () => {
  const sql = "SELECT periodo, categoria, valor FROM valores WHERE indicador='monitor_secas' AND territorio='CE'";
  assert.match(notasDeClassesDeSeca(sql).join(" "), /area_em_seca/);
  assert.deepEqual(notasDeClassesDeSeca("SELECT valor FROM valores WHERE indicador IN ('monitor_secas','area_em_seca')"), []);
  assert.deepEqual(notasDeClassesDeSeca("SELECT valor FROM valores WHERE indicador='idhm'"), []);
});

// Consultas reais do gamma (25/11/2026): o retrato de Itabuna e a comparação com Ilhéus.
const RETRATO_DE_ITABUNA =
  "SELECT v.indicador, v.periodo, v.valor FROM valores v WHERE v.territorio='2914802' AND ((v.indicador='pib' AND v.periodo='2023') OR (v.indicador='idhm' AND v.periodo='2010') OR (v.indicador='mortalidade_infantil' AND v.periodo='2024'))";

test("lê os pares indicador e período da consulta, com = e IN", () => {
  assert.deepEqual(periodosPorIndicador(RETRATO_DE_ITABUNA), [
    { id: "pib", periodos: ["2023"] },
    { id: "idhm", periodos: ["2010"] },
    { id: "mortalidade_infantil", periodos: ["2024"] },
  ]);
  assert.deepEqual(periodosPorIndicador("SELECT valor FROM valores WHERE (indicador='mortalidade_infantil' AND periodo IN ('2020','2024'))"), [
    { id: "mortalidade_infantil", periodos: ["2020", "2024"] },
  ]);
  assert.deepEqual(periodosPorIndicador("SELECT valor FROM valores WHERE indicador='pib' AND territorio='PB' AND periodo='2021'"), [
    { id: "pib", periodos: ["2021"] },
  ]);
});

test("avisa do ano mais recente quando a consulta pega um ano antigo (gamma, Itabuna e Ilhéus)", () => {
  const nota = notasDeAnoAntigo(RETRATO_DE_ITABUNA).join(" ");
  assert.match(nota, /mortalidade_infantil vai até 2025 \(a consulta pegou até 2024\)/);
  assert.doesNotMatch(nota, /pib|idhm/);
  assert.match(notasDaConsulta(RETRATO_DE_ITABUNA, ["indicador"], [{ indicador: "pib" }], false), /dado mais recente/);
});

test("não avisa com o ano mais recente, nem por ano em curso parcial ou projeção", () => {
  assert.deepEqual(notasDeAnoAntigo("SELECT valor FROM valores WHERE indicador='mortalidade_infantil' AND periodo IN ('2020','2025')"), []);
  // 2026 é parcial: 2025 é o mais recente que vale.
  assert.deepEqual(notasDeAnoAntigo("SELECT valor FROM valores WHERE indicador='cobertura_vacinal' AND periodo='2025'"), []);
  // 2030 e 2050 são projeções.
  assert.deepEqual(notasDeAnoAntigo("SELECT valor FROM valores WHERE indicador='indice_ameaca_escassez_hidrica' AND periodo='2020'"), []);
  assert.deepEqual(notasDeAnoAntigo("SELECT valor FROM valores WHERE indicador='area_em_seca' AND periodo='2026-08'"), []);
  // Conta entre dois anos com um alias por ano (c19-v1, GM02): vale o mais recente dos dois.
  assert.deepEqual(notasDeAnoAntigo("SELECT b.valor - a.valor FROM valores a, valores b WHERE a.indicador='populacao' AND a.periodo='2010' AND b.indicador='populacao' AND b.periodo='2022'"), []);
});

test("tabela larga traz o maior e o menor de cada coluna (gamma, capitais)", () => {
  const capitais = [
    { rotulo: "Recife", pib_per_capita_2023: 44563.38, analfabetismo_2022: 5.476 },
    { rotulo: "Teresina", pib_per_capita_2023: 33994.07, analfabetismo_2022: 7.12 },
    { rotulo: "Salvador", pib_per_capita_2023: 31724.15, analfabetismo_2022: 3.45 },
    { rotulo: "Maceió", pib_per_capita_2023: 35232.29, analfabetismo_2022: 8.42 },
  ];
  const saida = extremosPorColuna(["rotulo", "pib_per_capita_2023", "analfabetismo_2022"], capitais);
  assert.match(saida, /- pib_per_capita_2023: maior Recife; menor Salvador/);
  assert.match(saida, /- analfabetismo_2022: maior Maceió; menor Salvador/);
  // Uma coluna só (já tem o resumo de série/ranking) ou rótulo repetido: nada.
  assert.equal(extremosPorColuna(["rotulo", "pib_per_capita_2023"], capitais), "");
  assert.equal(extremosPorColuna(["rotulo", "pib_per_capita_2023", "analfabetismo_2022"], [...capitais, capitais[0]]), "");
});

test("diz o nome de cada código de território da consulta (gamma, Natal virou Ceará-Mirim)", () => {
  const sql = "SELECT valor FROM valores WHERE territorio IN ('2111300','2402600','9999999','rgi_250004') AND indicador='pib'";
  const nota = notasDosCodigos(sql).join(" ");
  assert.match(nota, /2111300 = São Luís \(MA\)/);
  assert.match(nota, /2402600 = Ceará-Mirim \(RN\)/);
  assert.match(nota, /9999999 = código que não existe/);
  assert.match(nota, /rgi_250004 = /);
  assert.deepEqual(notasDosCodigos("SELECT valor FROM valores WHERE territorio='PB' AND indicador='pib'"), []);
});
