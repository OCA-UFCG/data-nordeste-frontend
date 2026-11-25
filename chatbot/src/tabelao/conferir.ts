/**
 * Confere o tabelão (npm run conferir). Três conferências, todas só leitura:
 *
 *   1. Cálculo: para cada indicador, recalcula alguns recortes direto no
 *      Postgres (somando com GROUP BY lá, pelas colunas de recorte do cadastro)
 *      e compara com o tabelão. Pega erro do script de montagem: total por
 *      sexo errado, município fora de um recorte, razão tirada como média.
 *   2. Respostas conferidas à mão na proposta (23/11/2026).
 *   3. Cards do portal (Contentful): o número que o site mostra hoje. Card
 *      diferente do banco não é erro do tabelão: vai para a lista de correções
 *      dos cards (docs/inconsistencias-do-banco.md).
 *
 * Grava resultados/conferencia.md e sai com código 1 se 1 ou 2 falharem.
 */
import pg from "pg";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONSULTAS, DIMENSOES, INDICADORES, type Indicador, type Linha } from "./indicadores.ts";

const PACOTE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TABELAO = process.env.DATANE_TABELAO ?? path.join(PACOTE, "dados/datane.sqlite");
const db = new DatabaseSync(TABELAO, { readOnly: true });

/** Recortes recalculados no Postgres, pelas colunas do cadastro carac_mun.auxiliar. */
const RECORTES: Array<[string, string]> = [
  ["nordeste", "a.ne = 'Sim'"],
  ["area_sudene", "true"],
  ["PB", "a.sigla_uf = 'PB'"],
  ["MG_SUDENE", "a.sigla_uf = 'MG'"],
  ["semiarido", "a.semi_21 = 'Sim'"],
  ["caatinga", "a.caat_25 = 'Sim'"],
  ["rgint_2902", "a.cd_rgint = 2902"],
  ["2504009", "a.cd_mun = 2504009"],
];

type Resultado = { grupo: string; item: string; esperado: string; tabelao: string; ok: boolean; nota?: string };
const resultados: Resultado[] = [];

const fmt = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : Number(v.toPrecision(10)).toLocaleString("pt-BR", { maximumFractionDigits: 4 });

function doTabelao(indicador: string, territorio: string, periodo: string, recorte: Record<string, string>) {
  const filtro = DIMENSOES.map((d) => `${d} = '${(recorte[d] ?? "total").replaceAll("'", "''")}'`).join(" AND ");
  const r = db
    .prepare(`SELECT valor FROM valores WHERE indicador = ? AND territorio = ? AND periodo = ? AND ${filtro}`)
    .get(indicador, territorio, periodo) as { valor: number } | undefined;

  return r?.valor ?? null;
}

/**
 * Recalcula no Postgres, numa consulta só, o valor de todos os RECORTES para um
 * indicador, período e recorte, com a mesma expressão do catálogo.
 */
async function doBanco(cliente: pg.Client, ind: Indicador, linha: Linha, periodo: string, recorte: Record<string, string>) {
  const c = CONSULTAS.find((x) => x.id === ind.consulta)!;
  const [ano, mes] = periodo.split("-").map(Number);
  const dims = c.dimensoes.filter((d) => recorte[d] && recorte[d] !== "total").map((d) => `AND ${d} = '${recorte[d].replaceAll("'", "''")}'`);
  const den = linha.denominador ?? "NULL::float8";
  const valido = ind.agregacao === "razao" ? `(${linha.numerador}) IS NOT NULL AND (${den}) > 0` : `(${linha.numerador}) IS NOT NULL`;
  const recortes = RECORTES.map(([t, f]) => `('${t}', ${f})`).join(", ");
  const sql = `WITH c AS (${c.sql}),
    r AS (SELECT a.cd_mun, x.territorio FROM carac_mun.auxiliar a
          CROSS JOIN LATERAL (VALUES ${recortes}) AS x(territorio, dentro) WHERE a.aas_21 = 'Sim' AND x.dentro)
    SELECT r.territorio, SUM(${linha.numerador})::float8 AS num, SUM(${den})::float8 AS den
    FROM c JOIN r ON r.cd_mun = c.cd_mun
    WHERE ano = ${ano} ${mes ? `AND mes = ${mes}` : ""} ${dims.join(" ")} AND ${valido}
    GROUP BY r.territorio`;
  const linhas = (await cliente.query<{ territorio: string; num: number | null; den: number | null }>(sql)).rows;
  const valor = (r: { num: number | null; den: number | null }) =>
    r.num === null ? null : ind.agregacao === "razao" ? ((ind.fator ?? 1) * r.num) / (r.den ?? NaN) : r.num;

  return new Map(linhas.map((r) => [r.territorio, valor(r)]));
}

/** Um recorte de cada dimensão do indicador (ex.: Mulheres, Parda), para conferir também os totais. */
function recortesDeTeste(ind: Indicador): Array<{ linha: Linha; recorte: Record<string, string> }> {
  const out = [{ linha: ind.linhas[0], recorte: { ...ind.linhas[0].recorte } as Record<string, string> }];
  const ultima = ind.linhas.at(-1)!;
  if (ind.linhas.length > 1) out.push({ linha: ultima, recorte: { ...ultima.recorte } as Record<string, string> });
  const cats = db.prepare("SELECT dimensao, valor FROM categorias WHERE indicador = ? AND ordem = 2").all(ind.id) as Array<{ dimensao: string; valor: string }>;
  const c = CONSULTAS.find((x) => x.id === ind.consulta)!;
  const daConsulta = cats.filter((x) => c.dimensoes.includes(x.dimensao as never));
  // O recorte da própria linha vai junto: sem ele, a fórmula da linha
  // ("sem instrução") era comparada com o total das categorias no tabelão.
  if (daConsulta.length)
    out.push({ linha: ind.linhas[0], recorte: { ...ind.linhas[0].recorte, ...Object.fromEntries(daConsulta.map((x) => [x.dimensao, x.valor])) } });
  // Dimensão da consulta sem linha 'total' (vacina, classe de seca): o recorte
  // sem valor nela não existe no tabelão de propósito, então não entra.
  const semTotal = c.dimensoes.filter((d) => !(ind.totais ?? []).includes(d));

  return out.filter((o) => semTotal.every((d) => o.recorte[d] && o.recorte[d] !== "total"));
}

async function conferirCalculo(cliente: pg.Client) {
  for (const ind of INDICADORES) {
    const ultimo = (db.prepare("SELECT ultimo_periodo AS p FROM indicadores WHERE id = ?").get(ind.id) as { p: string }).p;
    // Indicador só municipal: só o município entra na conferência.
    const territorios = RECORTES.map(([t]) => t).filter((t) => ind.agregacao !== "municipal" || /^\d/.test(t));
    for (const { linha, recorte } of recortesDeTeste(ind)) {
      const banco = await doBanco(cliente, ind, linha, ultimo, recorte);
      const nome = Object.values(recorte).filter((v) => v !== "total").join(", ");
      for (const territorio of territorios) {
        const esperado = banco.get(territorio) ?? null;
        const tab = doTabelao(ind.id, territorio, ultimo, recorte);
        const ok = esperado === null ? tab === null : tab !== null && Math.abs(esperado - tab) <= Math.abs(esperado) * 1e-9 + 1e-9;
        resultados.push({ grupo: "cálculo", item: `${ind.id} ${territorio} ${ultimo}${nome ? ` (${nome})` : ""}`, esperado: fmt(esperado), tabelao: fmt(tab), ok });
      }
    }
    process.stdout.write(".");
  }
  process.stdout.write("\n");
}

type Checagem = { item: string; indicador: string; territorio: string; periodo: string; recorte?: Record<string, string>; esperado: number; casas: number; nota?: string };

/** Respostas da avaliação da proposta, conferidas à mão no banco em 23/11/2026. */
const RESPOSTAS: Checagem[] = [
  { item: "População de Campina Grande–PB, 2022", indicador: "populacao", territorio: "2504009", periodo: "2022", esperado: 419379, casas: 0 },
  { item: "Mortalidade infantil do Nordeste, 2024", indicador: "mortalidade_infantil", territorio: "nordeste", periodo: "2024", esperado: 13.54, casas: 2 },
  { item: "Mortalidade infantil da Paraíba, 2024", indicador: "mortalidade_infantil", territorio: "PB", periodo: "2024", esperado: 12.31, casas: 2 },
  { item: "Mortalidade infantil do Brasil, 2024", indicador: "mortalidade_infantil", territorio: "brasil", periodo: "2024", esperado: 12.56, casas: 2 },
  { item: "PIB per capita de São Francisco do Conde–BA, 2023", indicador: "pib_per_capita", territorio: "2929206", periodo: "2023", esperado: 684319.23, casas: 2 },
  { item: "Analfabetismo de mulheres pretas de 60+ no Nordeste, 2022", indicador: "taxa_analfabetismo", territorio: "nordeste", periodo: "2022", recorte: { sexo: "Mulheres", cor_raca: "Preta", faixa_etaria: "60 anos ou mais" }, esperado: 42.54, casas: 2 },
  { item: "IDHM de Santa Luzia–PB, 2010", indicador: "idhm", territorio: "2513406", periodo: "2010", esperado: 0.682, casas: 3 },
  { item: "Cobertura de BCG em Recife, 2025", indicador: "cobertura_vacinal", territorio: "2611606", periodo: "2025", recorte: { categoria: "BCG" }, esperado: 128.37, casas: 2 },
  { item: "Pessoas em situação de rua em Fortaleza, 2026", indicador: "pessoas_situacao_rua", territorio: "2304400", periodo: "2026", esperado: 11966, casas: 0 },
  { item: "Pessoas em situação de rua em Fortaleza, 2022", indicador: "pessoas_situacao_rua", territorio: "2304400", periodo: "2022", esperado: 5568, casas: 0 },
  { item: "Lixo coletado (com caçamba) no Ceará, 2022", indicador: "lixo_coletado", territorio: "CE", periodo: "2022", esperado: 85.48, casas: 2 },
  { item: "Lixo coletado por serviço de limpeza no Ceará, 2022", indicador: "destino_lixo", territorio: "CE", periodo: "2022", recorte: { categoria: "Coletado por serviço de limpeza" }, esperado: 77.16, casas: 2 },
  { item: "Campina Grande em seca fraca (S0), agosto de 2026", indicador: "monitor_secas", territorio: "2504009", periodo: "2026-08", recorte: { categoria: "S0 – Seca fraca" }, esperado: 100, casas: 1 },
];

/** Cards de indicador do portal (Contentful), lidos em 23/11/2026. */
const CARDS: Checagem[] = [
  { item: "População residente (Nordeste): 54.658.515", indicador: "populacao", territorio: "nordeste", periodo: "2022", esperado: 54658515, casas: 0 },
  { item: "População feminina (Nordeste): 30.598.265", indicador: "populacao", territorio: "nordeste", periodo: "2022", recorte: { sexo: "Mulheres" }, esperado: 30598265, casas: 0, nota: "o card mostra o valor da área da Sudene (30.598.265) com o rótulo Nordeste" },
  { item: "População masculina (Nordeste): 28.719.654", indicador: "populacao", territorio: "nordeste", periodo: "2022", recorte: { sexo: "Homens" }, esperado: 28719654, casas: 0, nota: "o card mostra o valor da área da Sudene (28.719.654) com o rótulo Nordeste" },
  { item: "PIB (Nordeste): R$ 1,51 tri", indicador: "pib", territorio: "nordeste", periodo: "2023", esperado: 1.51e12, casas: -10 },
  { item: "PIB per capita (Nordeste): R$ 27,68 Mi", indicador: "pib_per_capita", territorio: "nordeste", periodo: "2023", esperado: 27680, casas: -1, nota: "o número bate, mas a unidade do card está errada: é R$ 27,68 mil, não milhões" },
  { item: "Analfabetismo (Nordeste): 14,21%", indicador: "taxa_analfabetismo", territorio: "nordeste", periodo: "2022", esperado: 14.21, casas: 2 },
  { item: "Mortalidade infantil (Nordeste): 13,11", indicador: "mortalidade_infantil", territorio: "nordeste", periodo: "2025", esperado: 13.11, casas: 2 },
  { item: "Nascidos vivos (Nordeste): 679 mil", indicador: "nascidos_vivos", territorio: "nordeste", periodo: "2025", esperado: 679000, casas: -3 },
  { item: "Cisternas (Nordeste): 1.278.849", indicador: "cisternas", territorio: "nordeste", periodo: "2026", esperado: 1278849, casas: 0 },
  { item: "Cisterna para abastecimento humano: 1.108.343", indicador: "cisternas_consumo", territorio: "nordeste", periodo: "2026", esperado: 1108343, casas: 0 },
  { item: "Cisterna para irrigação: 161.124", indicador: "cisternas_producao", territorio: "nordeste", periodo: "2026", esperado: 161124, casas: 0, nota: "card defasado; e a categoria é 'produção' (irrigação e criação de animais), não só irrigação" },
  { item: "Cisterna para atividades escolares: 7.894", indicador: "cisternas_escolas", territorio: "nordeste", periodo: "2026", esperado: 7894, casas: 0 },
  { item: "Lixo coletado (Nordeste): 74,6%", indicador: "lixo_coletado", territorio: "nordeste", periodo: "2022", esperado: 74.6, casas: 1, nota: "o banco dá 83,3% em 2022 (74,97% em 2010)" },
  { item: "Descarte inapropriado de lixo (Nordeste): 74,6%", indicador: "lixo_coletado", territorio: "nordeste", periodo: "2022", esperado: 100 - 74.6, casas: 1, nota: "mesmo número do card de lixo coletado; o complemento da coleta em 2022 é 16,7%" },
  { item: "Domicílios conectados à rede (Nordeste): 40,2%", indicador: "esgoto_rede_geral", territorio: "nordeste", periodo: "2022", esperado: 40.2, casas: 1 },
  { item: "Condições sanitárias (Nordeste): 1,50%", indicador: "esgotamento", territorio: "nordeste", periodo: "2022", recorte: { categoria: "Sem banheiro nem sanitário" }, esperado: 1.5, casas: 2, nota: "o card não diz o que mede; o mais próximo no banco é 'sem banheiro nem sanitário' (1,52%)" },
  { item: "População em situação de rua (Nordeste): 57,05 milhões", indicador: "pessoas_situacao_rua", territorio: "nordeste", periodo: "2026", esperado: 57050, casas: 0, nota: "o banco dá 57.836 pessoas em 2026 (54.909 em 2025); 'milhões' está errado" },
];

function conferirLista(grupo: string, lista: Checagem[]) {
  for (const c of lista) {
    const tab = doTabelao(c.indicador, c.territorio, c.periodo, c.recorte ?? {});
    const arred = (v: number) => Math.round(v * 10 ** c.casas) / 10 ** c.casas;
    const valor = tab === null ? null : c.item.startsWith("Descarte") ? 100 - tab : tab;
    const ok = valor !== null && arred(valor) === arred(c.esperado);
    resultados.push({ grupo, item: c.item, esperado: fmt(c.esperado), tabelao: fmt(valor), ok, nota: ok ? undefined : c.nota });
  }
}

function relatorio() {
  const linhas = [
    "# Conferência do tabelão",
    "",
    `Gerada por \`npm run conferir\` em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Fortaleza" })}.`,
    "",
  ];
  for (const grupo of ["cálculo", "respostas", "cards do portal"]) {
    const rs = resultados.filter((r) => r.grupo === grupo);
    const falhas = rs.filter((r) => !r.ok);
    linhas.push(`## ${grupo[0].toUpperCase()}${grupo.slice(1)}: ${rs.length - falhas.length} de ${rs.length} batem`, "");
    const mostrar = grupo === "cálculo" ? falhas : rs;
    if (!mostrar.length) {
      linhas.push("Todas batem.", "");
      continue;
    }
    linhas.push("| | Item | Esperado | Tabelão | Nota |", "|---|---|---|---|---|");
    for (const r of mostrar) linhas.push(`| ${r.ok ? "ok" : "**difere**"} | ${r.item} | ${r.esperado} | ${r.tabelao} | ${r.nota ?? ""} |`);
    linhas.push("");
  }

  return linhas.join("\n");
}

async function main() {
  const cliente = new pg.Client({ application_name: "datane-chatbot (conferir, so leitura)" });
  await cliente.connect();
  await cliente.query("SET default_transaction_read_only = on");
  await cliente.query("SET statement_timeout = '5min'");
  try {
    await conferirCalculo(cliente);
  } finally {
    await cliente.end();
  }
  conferirLista("respostas", RESPOSTAS);
  conferirLista("cards do portal", CARDS);
  mkdirSync(path.join(PACOTE, "resultados"), { recursive: true });
  const texto = relatorio();
  writeFileSync(path.join(PACOTE, "resultados/conferencia.md"), texto + "\n");
  console.log(texto);
  const falhas = resultados.filter((r) => !r.ok && r.grupo !== "cards do portal").length;
  process.exit(falhas ? 1 : 0);
}

await main();
