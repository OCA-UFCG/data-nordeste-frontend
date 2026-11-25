/**
 * consultar_sql: a ferramenta principal. Roda um SELECT no tabelão e devolve a
 * tabela, o "Resumo calculado" de séries e rankings e os avisos de notas.ts.
 * Com o parâmetro grafico, a página desenha uma série, um ranking ou um mapa
 * de municípios com o resultado. Adaptado do chat do SEDES.
 */
import { z } from "zod";
import { db, ehNumero, RODAPE, tabela, type Linhas } from "./banco.ts";
import { ESQUEMA } from "./esquema.ts";
import { corrigirColunasInventadas, dicaDoErro, notasDaConsulta, notasDeConsultaVazia } from "./notas.ts";
import { CATALOGO, indicadoresNoSql } from "./catalogo.ts";
import { resumoCalculado } from "./resumo.ts";
import { executarSql, LIMITE_LINHAS, PRAZO_SQL_MS, validarSql } from "./sql.ts";
import type { Ferramenta } from "./tipos.ts";

const LIMITE_GRAFICO = 60;
const LIMITE_MAPA = 3000;

type Grafico = { tipo: "serie" | "ranking" | "mapa"; titulo: string; unidade?: string };

/** Acha as colunas do gráfico quando a consulta não as chamou de rotulo e valor. */
function colunasDoGrafico(colunas: string[], linhas: Linhas): { rotulo: string; valor: string } | null {
  const numerica = (c: string) => linhas.every((l) => ehNumero(l[c]));
  const valor = colunas.includes("valor") ? "valor" : colunas.find((c) => c !== colunas[0] && numerica(c));
  const rotulo = colunas.includes("rotulo") ? "rotulo" : colunas.find((c) => c !== valor);

  return valor && rotulo && numerica(valor) ? { rotulo, valor } : null;
}

export type ItemDoMapa = { codigo: string; nome: string; valor: number };

let nomesDosMunicipios: Map<string, string> | undefined;

/** As linhas de uma consulta de mapa (codigo, valor), com o nome do município. */
export function itensDoMapa(colunas: string[], linhas: Linhas): ItemDoMapa[] | string {
  const colCodigo = colunas.includes("codigo") ? "codigo" : colunas.find((c) => linhas.every((l) => /^\d{7}$/.test(String(l[c]))));
  const colValor = colunas.includes("valor") ? "valor" : colunas.find((c) => c !== colCodigo && linhas.every((l) => ehNumero(l[c])));
  if (!colCodigo || !colValor)
    return `com grafico tipo 'mapa', a consulta tem de devolver as colunas codigo (IBGE de 7 dígitos do município) e valor (número); devolveu ${colunas.join(", ")}.`;
  nomesDosMunicipios ??= new Map(
    (db.prepare("SELECT codigo, nome || '–' || uf AS nome FROM territorios WHERE tipo = 'municipio'").all() as Array<{ codigo: string; nome: string }>).map(
      (t) => [t.codigo, t.nome],
    ),
  );
  const itens: ItemDoMapa[] = [];
  for (const l of linhas) {
    const codigo = String(l[colCodigo]);
    const nome = nomesDosMunicipios.get(codigo);
    const valor = l[colValor];
    if (nome && ehNumero(valor)) itens.push({ codigo, nome, valor });
  }
  if (itens.length < 2) return "o mapa precisa de pelo menos 2 municípios com valor numérico (a coluna codigo é o código IBGE do município, t.codigo).";

  return itens;
}

// Filtro da consulta do mapa → território agregado que ele representa.
const RECORTE_DO_FILTRO: Array<[RegExp, (m: RegExpExecArray) => string]> = [
  [/\buf\s*=\s*'([A-Z]{2})'/i, (m) => (["MG", "ES"].includes(m[1].toUpperCase()) ? `${m[1].toUpperCase()}_SUDENE` : m[1].toUpperCase())],
  [/\bcd_rgint\s*=\s*'?(\d{4})'?/i, (m) => `rgint_${m[1]}`],
  [/\bcd_rgi\s*=\s*'?(\d{6})'?/i, (m) => `rgi_${m[1]}`],
  [/\bsemiarido\s*=\s*1\b/i, () => "semiarido"],
  [/\bcaatinga\s*=\s*1\b/i, () => "caatinga"],
  [/\bnordeste\s*=\s*1\b/i, () => "nordeste"],
];

/**
 * O valor do recorte inteiro que o mapa mostra (ex.: a Paraíba num mapa dos
 * municípios da PB). No teste SC02 da rodada v1, o Haiku não seguiu a dica de
 * consultar o estado e respondeu sem ele; aqui o número já vem na saída.
 */
function valorDoRecorte(sql: string): string {
  const ids = indicadoresNoSql(sql);
  const periodos = [...new Set(sql.match(/'\d{4}(-\d{2})?'/g) ?? [])];
  if (ids.length !== 1 || periodos.length !== 1) return "";
  const filtro = RECORTE_DO_FILTRO.map(([re, f]) => {
    const m = re.exec(sql);

    return m ? f(m) : null;
  }).find(Boolean) ?? "area_sudene";
  const categoria = /\bcategoria\s*=\s*'([^']+)'/i.exec(sql)?.[1] ?? "total";
  const r = db
    .prepare(
      `SELECT t.nome, v.valor FROM valores v JOIN territorios t ON t.codigo = v.territorio
       WHERE v.indicador = ? AND v.periodo = ? AND v.territorio = ? AND v.categoria = ?
         AND v.sexo = 'total' AND v.cor_raca = 'total' AND v.faixa_etaria = 'total'`,
    )
    .get(ids[0], periodos[0].slice(1, -1), filtro, categoria) as { nome: string; valor: number } | undefined;
  if (!r) return "";
  const i = CATALOGO.find((x) => x.id === ids[0])!;

  return `Valor do recorte inteiro (já calculado, use este e não uma média dos municípios): ${r.nome} = ${arredondar(r.valor, i.casas)} (${i.unidade}).`;
}

const arredondar = (v: number, casas: number) => Math.round(v * 10 ** casas) / 10 ** casas;

/**
 * Arredonda a coluna valor às casas do catálogo quando a consulta é de um
 * indicador só. Na rodada v1, a ferramenta mostrava 3 casas e o modelo
 * arredondava de novo (109,725 virou 109,73; o certo é 109,72) ou copiava as
 * 3 casas ("17,663%"). Colunas calculadas na consulta ficam como vieram.
 *
 * IMPORTANT: só no que é mostrado. O resumo calculado usa o valor exato: na
 * rodada v2, arredondar antes fez 99,96% virar 100% e o "maior valor" do mapa
 * passou de 4 para 63 municípios.
 */
type Exibir = (v: number) => number;
function exibirComCasas(sql: string): Exibir {
  const ids = indicadoresNoSql(sql);
  const casas = ids.length === 1 ? CATALOGO.find((x) => x.id === ids[0])?.casas : undefined;

  return casas === undefined ? (v) => v : (v) => arredondar(v, casas);
}

const comValorExibido = (linhas: Linhas, exibir: Exibir): Linhas =>
  linhas.map((l) => (ehNumero(l.valor) ? { ...l, valor: exibir(l.valor) } : l));

/** A saída de um mapa para o modelo: o resumo e os extremos, não as centenas de linhas. */
function saidaDoMapa(sql: string, colunas: string[], linhas: Linhas, notas: string): string {
  const itens = itensDoMapa(colunas, linhas);
  if (typeof itens === "string") return `Erro: ${itens}`;
  const ordenados = [...itens].sort((a, b) => b.valor - a.valor);
  const exibir = exibirComCasas(sql);
  const mostrar = (ls: ItemDoMapa[]) => tabela(["municipio", "valor"], ls.map((i) => ({ municipio: i.nome, valor: exibir(i.valor) })));

  return (
    [
      `Mapa desenhado na página com ${itens.length} municípios (a pessoa vê todos pintados pelo valor). Você recebe só o resumo e os extremos:`,
      "",
      resumoCalculado("ranking", ordenados.map((i) => ({ rotulo: i.nome, valor: i.valor }))),
      "",
      "Os 10 maiores:",
      mostrar(ordenados.slice(0, 10)),
      "",
      "Os 5 menores:",
      mostrar(ordenados.slice(-5)),
      "",
      valorDoRecorte(sql) ||
        "Para o número do estado ou do recorte inteiro, consulte o território dele (ex.: 'PB', 'semiarido'), que já está calculado; não use média dos municípios.",
    ].join("\n") +
    notas +
    RODAPE
  );
}

/** Roda de novo a consulta de um mapa, para a página buscar todos os valores. */
export async function dadosDoMapa(sql: string): Promise<ItemDoMapa[] | string> {
  const invalido = validarSql(sql);
  if (invalido) return invalido;
  const r = await executarSql(sql, LIMITE_MAPA);
  if (!r.ok) return r.erro;

  return itensDoMapa(r.colunas, r.linhas);
}

/**
 * Tabela para a saída que NÃO deve virar gráfico: a página desenha o gráfico
 * de toda saída que começa com "rotulo | valor" (pagina/grafico.js), então a
 * coluna rotulo sai com outro nome.
 */
function tabelaSemGrafico(colunas: string[], linhas: Linhas): string {
  if (!colunas.includes("rotulo")) return tabela(colunas, linhas);
  const renomear = (c: string) => (c === "rotulo" ? "item" : c);

  return tabela(
    colunas.map(renomear),
    linhas.map((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [renomear(k), v]))),
  );
}

/** O primeiro rótulo que aparece em mais de uma linha. */
function rotuloRepetido(linhas: Linhas, coluna: string): string {
  const vistos = new Set<string>();
  for (const l of linhas) {
    const r = String(l[coluna]);
    if (vistos.has(r)) return r;
    vistos.add(r);
  }

  return "";
}

function saidaDoGrafico(sql: string, grafico: Grafico, colunas: string[], linhas: Linhas, aviso: string): string {
  const exibir = exibirComCasas(sql);
  const c = colunasDoGrafico(colunas, linhas);
  if (!c)
    return `Erro: com grafico, a consulta tem de devolver uma coluna de rótulo e uma coluna numérica chamada valor (use AS); devolveu ${colunas.join(", ")}.`;
  // Série com várias linhas por período (uma por categoria ou recorte): o
  // gráfico misturaria as linhas. Devolve a tabela e diz como pedir.
  const rotulos = new Set(linhas.map((l) => String(l[c.rotulo])));
  if (grafico.tipo === "serie" && rotulos.size < linhas.length)
    return `${tabelaSemGrafico(colunas, comValorExibido(linhas, exibir))}\nNota: saiu SEM gráfico. O gráfico de série precisa de uma linha por período, e esta consulta traz várias (categorias ou recortes diferentes). Os dados acima valem para responder; para o gráfico, filtre um recorte só.${aviso}${RODAPE}`;
  // Ranking com o mesmo rótulo em várias barras ("Campina Grande" três vezes,
  // uma por Censo): a pessoa não sabe qual barra é qual (conversa fe633356,
  // 24/11/2026; o modelo só corrigiu quando a pessoa reclamou).
  if (grafico.tipo === "ranking" && rotulos.size < linhas.length)
    return `${tabelaSemGrafico(colunas, comValorExibido(linhas, exibir))}\nNota: saiu SEM gráfico. No ranking, cada barra precisa de um rótulo diferente, e "${rotuloRepetido(linhas, c.rotulo)}" aparece mais de uma vez. Os dados acima valem para responder. Para ter o gráfico, consulte de novo com o que diferencia as linhas no rótulo (por exemplo nome || ' (' || periodo || ')') ou filtre um período só.${aviso}${RODAPE}`;
  const pontos = linhas.map((l) => ({ rotulo: String(l[c.rotulo]), valor: l[c.valor] as number }));
  // Série longa (80 meses de seca): antes saía só um erro, o modelo partia em
  // dois gráficos e juntava os dois resumos de cabeça, errando o "mais baixo"
  // (rodada c7-todas, SE02). Agora vem a tabela com o resumo da série inteira.
  if (linhas.length > LIMITE_GRAFICO && grafico.tipo === "serie")
    // Cabeçalho "periodo | valor", não "rotulo | valor": a página desenha o
    // gráfico de toda saída que começa com "rotulo | valor" (grafico.js).
    return `${tabela(["periodo", "valor"], pontos.map((p) => ({ periodo: p.rotulo, valor: exibir(p.valor) })))}\n\n${resumoCalculado("serie", pontos, grafico.unidade)}\nNota: saiu SEM gráfico: ${linhas.length} períodos, e o gráfico aceita até ${LIMITE_GRAFICO}. O Resumo calculado acima é da série inteira: use ele para maior, menor e viradas, e não junte resumos de pedaços. Para ter gráfico, consulte de novo só os períodos mais recentes (até ${LIMITE_GRAFICO}).${aviso}${RODAPE}`;
  if (linhas.length > LIMITE_GRAFICO) return `Erro: ${linhas.length} linhas; o gráfico aceita até ${LIMITE_GRAFICO}. Filtre ou use LIMIT.`;
  const outras = colunas.filter((x) => x !== c.rotulo && x !== c.valor);
  const resumo = resumoCalculado(grafico.tipo as "serie" | "ranking", pontos, grafico.unidade);

  // A página lê a tabela "rotulo | valor"; colunas a mais vão depois dela.
  return (
    [
      tabela(["rotulo", "valor"], pontos.map((p) => ({ ...p, valor: exibir(p.valor) }))),
      ...(resumo ? ["", resumo] : []),
      ...(outras.length ? ["", "Outras colunas da consulta:", tabela(colunas, comValorExibido(linhas, exibir))] : []),
    ].join("\n") +
    aviso +
    RODAPE
  );
}

/** Série sem gráfico (período e um número): o resumo ajuda do mesmo jeito. */
function resumoSemGrafico(colunas: string[], linhas: Linhas): string {
  const periodo = colunas.find((c) => linhas.every((l) => /^\d{4}(-\d{2})?$/.test(String(l[c]))));
  const outra = colunas.find((c) => c !== periodo && linhas.every((l) => ehNumero(l[c])));
  if (!periodo || !outra || colunas.length !== 2) return "";
  // Período repetido = duas séries juntas (duas cidades): o resumo misturaria
  // as duas ("4 períodos, de 2013 a 2023"; PS36, c13-todas).
  if (new Set(linhas.map((l) => String(l[periodo]))).size < linhas.length) return "";

  return resumoCalculado("serie", linhas.map((l) => ({ rotulo: String(l[periodo]), valor: l[outra] as number })));
}

async function consultar({ sql, grafico }: { sql: string; grafico?: Grafico }): Promise<string> {
  const invalido = validarSql(sql);
  if (invalido) return `Erro: ${invalido}`;
  const final = corrigirColunasInventadas(sql);
  const r = await executarSql(final, grafico?.tipo === "mapa" ? LIMITE_MAPA : LIMITE_LINHAS);
  if (!r.ok) return `Erro: ${r.erro}${dicaDoErro(final, r.erro)}`;
  if (!r.linhas.length) return `Nenhuma linha. (Linha ausente = sem dado para aquele filtro.)${notasDeConsultaVazia(final)}${RODAPE}`;
  const limit = /\blimit\s+(\d+)\s*;?\s*$/iu.exec(final);
  const notas = notasDaConsulta(final, r.colunas, r.linhas, Boolean(limit) && r.linhas.length >= Number(limit![1]));
  if (grafico?.tipo === "mapa") return saidaDoMapa(final, r.colunas, r.linhas, notas);
  const aviso = (r.truncado ? `\n(Mostrando só as primeiras ${LIMITE_LINHAS} linhas; refine a consulta.)` : "") + notas;
  if (grafico) return saidaDoGrafico(final, grafico, r.colunas, r.linhas, aviso);
  const resumo = resumoSemGrafico(r.colunas, r.linhas);

  // Sem grafico, a coluna rotulo não pode abrir a saída: a página desenharia
  // um gráfico que o modelo não pediu (PS36, c13-todas: duas cidades numa série).
  return `${tabelaSemGrafico(r.colunas, comValorExibido(r.linhas, exibirComCasas(final)))}${resumo ? `\n\n${resumo}` : ""}${aviso}${RODAPE}`;
}

export const consultarSql: Ferramenta = {
  nome: "consultar_sql",
  titulo: "Consultar os dados com SQL",
  descricao: `Roda uma consulta SELECT/WITH (SQLite) nos dados do assistente do Data Nordeste e devolve até ${LIMITE_LINHAS} linhas. Gráfico: para uma série histórica (3 períodos ou mais) ou um ranking (4 itens ou mais), passe também grafico; a página desenha o gráfico. Com grafico serie ou ranking, a consulta devolve as colunas rotulo (período ou nome) e valor, na ordem do gráfico (série do mais antigo ao mais recente, ranking do maior ao menor), até ${LIMITE_GRAFICO} linhas; a saída traz um "Resumo calculado" para citar. Mapa: para "onde" dentro de um estado, região ou recorte (ou quando pedirem um mapa), passe grafico tipo 'mapa' e uma consulta com as colunas codigo (IBGE do município) e valor, uma linha por município, sem LIMIT. O link para o painel do portal é montado sozinho a partir das consultas. Tempo máximo ${PRAZO_SQL_MS / 1000} s. Erros voltam como texto: corrija e tente de novo.\n\n${ESQUEMA}`,
  entrada: {
    sql: z.string().min(6).describe("Uma consulta SELECT ou WITH"),
    grafico: z
      .object({
        tipo: z.enum(["serie", "ranking", "mapa"]),
        titulo: z.string().max(140).describe("Curto: o que é o valor, o território e o período."),
        unidade: z.string().max(40).optional().describe("Ex.: '%', 'R$', 'por mil nascidos vivos', '% da área'"),
      })
      .optional()
      .describe("Para séries históricas, rankings e mapas de municípios: a página desenha"),
  },
  async executar(args: { sql: string; grafico?: Grafico }) {
    return consultar(args);
  },
};
