/**
 * Avisos que vão junto do resultado de consultar_sql, onde o modelo lê.
 *
 * A lição do chat do SEDES: ressalva escrita só no prompt o Haiku esquece;
 * colada no resultado da consulta que precisa dela, ele cumpre. Cada aviso
 * aqui corresponde a um erro que o tabelão permite cometer.
 */
import { CATALOGO, IDS, SO_INDICE, dimensoesDe, indicadoresNoSql, metasDasVacinas, sobreOsIndicadores } from "./catalogo.ts";
import { distancia } from "./territorio.ts";
import { CONSULTAS, INDICADORES, type Dimensao, type Indicador } from "../tabelao/indicadores.ts";
import { ehNumero, type Linhas } from "./banco.ts";

/**
 * Dimensões que têm a linha 'total' em cada indicador: as que o catálogo soma
 * (totais) e as que alguma linha deixa sem recorte, numa consulta que não traz
 * a dimensão (ex.: a linha da população total tem sexo e cor 'total').
 */
function dimensoesComTotal(ind: Indicador): Set<Dimensao> {
  const daConsulta = new Set(CONSULTAS.find((c) => c.id === ind.consulta)?.dimensoes ?? []);
  const semRecorte = (["sexo", "cor_raca", "faixa_etaria", "categoria"] as Dimensao[]).filter(
    (d) => !daConsulta.has(d) && ind.linhas.some((l) => l.recorte?.[d] === undefined),
  );

  return new Set([...(ind.totais ?? []), ...semRecorte]);
}
const TOTAIS = new Map(INDICADORES.map((i) => [i.id, dimensoesComTotal(i)]));
const MUNICIPAIS = new Set(CATALOGO.filter((i) => i.agregacao === "municipal").map((i) => i.id));
const ANO_EM_CURSO = String(new Date().getFullYear());
const COM_ANO_PARCIAL = new Set(
  CATALOGO.filter((i) => i.periodicidade === "anual" && i.ultimo_periodo === ANO_EM_CURSO).map((i) => i.id),
);

/**
 * Id escrito errado não dá erro no SQL, só não traz linhas, e o modelo
 * concluía que "não há dado". Olha os literais comparados com a coluna
 * indicador e sugere os ids parecidos.
 */
export function notasDeIdsDesconhecidos(sql: string): string[] {
  const trechos = [...sql.matchAll(/\bindicador\s*(?:=|in\s*\()\s*([^)]*?)(?:\)|\band\b|\bor\b|\border\b|\bgroup\b|$)/gis)].map((m) => m[1]);
  const literais = new Set(trechos.flatMap((t) => (t.match(/'[^']+'/g) ?? []).map((x) => x.slice(1, -1))));
  const notas: string[] = [];
  for (const literal of literais) {
    if (IDS.has(literal)) continue;
    const parecidos = [...IDS]
      .map((id) => ({ id, d: distancia(literal, id) - (id.includes(literal) || literal.includes(id) ? 5 : 0) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map((x) => `'${x.id}'`);
    notas.push(
      `ATENÇÃO: não existe indicador com o id '${literal}', por isso ele não trouxe linhas. Ids parecidos: ${parecidos.join(", ")}. Refaça com o id certo do catálogo; não diga que o dado não existe.`,
    );
  }

  return notas;
}

/**
 * Indicador com recortes (sexo, cor, faixa etária, categoria) e consulta que
 * não filtrou a dimensão: as linhas trazem o total e cada recorte juntos, e um
 * SUM conta tudo duas vezes. Na categoria sem total (vacinas, classes de
 * seca), somar categorias não faz sentido.
 */
export function notasDosRecortes(sql: string): string[] {
  const notas: string[] = [];
  for (const id of indicadoresNoSql(sql)) {
    for (const [dim, valores] of dimensoesDe(id)) {
      if (new RegExp(`\\b${dim}\\b`, "i").test(sql)) continue;
      const temTotal = TOTAIS.get(id)?.has(dim as Dimensao);
      notas.push(
        temTotal
          ? `ATENÇÃO: '${id}' tem a dimensão ${dim} (${valores.slice(0, 6).join(", ")}${valores.length > 6 ? "…" : ""}) e esta consulta não a filtrou: as linhas misturam o total com cada ${dim}. Para o total, filtre ${dim} = 'total'; nunca some as linhas de ${dim}.`
          : `ATENÇÃO: '${id}' tem uma linha por ${dim} (${valores.slice(0, 6).join(", ")}${valores.length > 6 ? "…" : ""}) e não há total entre elas. Filtre ${dim} ou fale de cada uma; não some ${dim === "categoria" ? "categorias" : "as linhas"} diferentes.`,
      );
    }
  }

  return notas;
}

function notasDoResultado(sql: string, colunas: string[], linhas: Linhas): string[] {
  const notas: string[] = [];
  const ids = indicadoresNoSql(sql);
  if (ids.includes("cobertura_vacinal") && linhas.some((l) => colunas.some((c) => ehNumero(l[c]) && (l[c] as number) > 100 && (l[c] as number) < 5000 && /valor|cobertura/i.test(c))))
    notas.push(
      "Nota: há cobertura vacinal acima de 100%. Diga isso e explique em uma frase: acontece quando o município vacina crianças de outros municípios ou quando o público-alvo estimado é menor que o real.",
    );
  // Código de município (7 dígitos) e de recorte na mesma coluna: ranking ou
  // média que mistura os dois níveis está errado.
  const mistura = colunas.some((c) => {
    const vs = linhas.map((l) => String(l[c] ?? ""));

    return vs.some((v) => /^\d{7}$/.test(v)) && vs.some((v) => /^(nordeste|area_sudene|semiarido|caatinga|brasil|[A-Z]{2}(_SUDENE)?|rgi(nt)?_\d+)$/.test(v));
  });
  if (mistura)
    notas.push(
      "ATENÇÃO: o resultado mistura municípios com estados ou recortes (a tabela valores tem os dois). Para ranking ou contagem de municípios, junte com territorios e filtre t.tipo = 'municipio'.",
    );

  return notas;
}

/**
 * Ressalvas que mudam a leitura do número e que o Haiku, lendo só o catálogo
 * do prompt, deixava de dizer:
 * - INC-18: "1 criança em situação de rua em Fortaleza", com 11.362 pessoas em
 *   situação de rua no mesmo ano, sem ressalva (rodada c3-v0, IN01).
 * - INC-8: "2021, o mais recente disponível" para setores, como se não
 *   houvesse PIB depois (rodadas v2 e c3-v1, E01 e IN09).
 */
const SETORES =
  "Nota: 2021 é o último ano com divisão por setor. O PIB de 2022 e 2023 existe, mas sem setores no banco (INC-8). Diga isso quando usar 2021 como o ano mais recente.";
const RESSALVAS_DOS_INDICADORES: Record<string, string> = {
  // c12-v0, TN04: com a ressalva só no catálogo, o Haiku escreveu "4.137,42 km²
  // em cada ano" para a Caatinga da Bahia de 2001 a 2004 (INC-19).
  desmatamento:
    "Nota: no desmatamento, anos seguidos com o mesmo valor são UM período medido junto pelo PRODES (INC-19), não o mesmo valor a cada ano. Escreva \"X km² no período de 2001 a 2004\", nunca \"X km² por ano\" ou \"em cada ano\"; não some esses anos nem diga que ficou estável.",
  // c12-todas, PX08: "qual tem mais renda?" saiu só com o PIB per capita e a
  // frase "o portal não tem dados de renda", com renda_per_capita no catálogo.
  pib_per_capita:
    "Nota: PIB per capita não é renda das pessoas. Se a pergunta é de renda (\"mais renda\", \"ganha mais\", \"poder de compra\"), consulte também renda_per_capita (Atlas, só por município, último ano 2010) e dê os dois com o ano; não diga que o portal não tem dado de renda.",
  valor_adicionado: SETORES,
  participacao_setor: SETORES,
  criancas_situacao_rua:
    "ATENÇÃO: criancas_situacao_rua não é confiável (INC-18): 239 municípios em 2022 e 110 em 2025 têm mais crianças do que pessoas em situação de rua no total, e a soma do Nordeste inteiro é 0 em 2023, 2024 e 2026 (é o Nordeste, não o município consultado). Diga isso antes do número e mostre também o total de pessoas em situação de rua (pessoas_situacao_rua) do mesmo lugar e ano.",
  idosos_situacao_rua:
    "Nota: em alguns municípios (13 a 33 por ano) idosos_situacao_rua passa do total de pessoas em situação de rua (INC-18). Em município, diga que o número pede cautela.",
  pcd_situacao_rua:
    "Nota: em alguns municípios (39 a 80 por ano) pcd_situacao_rua passa do total de pessoas em situação de rua (INC-18). Em município, diga que o número pede cautela.",
  // "Em seca" sem dizer que conta a seca fraca (S0) e "últimos 12 meses" sem
  // dizer que o dado para em agosto (c9-todas, DF05 e QS01).
  area_em_seca:
    "Nota: area_em_seca conta qualquer seca, da fraca (S0) à excepcional (S4). Diga na resposta que inclui a seca fraca. Se a pessoa pediu um período até hoje, diga qual é o último mês com dado.",
};

/**
 * Recortes cujo nome engana: quem lê "Caatinga" pensa no bioma, e "Minas
 * Gerais" no estado inteiro. A ressalva vai junto do número (c3-v0, TE05).
 */
const RECORTES_COM_RESSALVA: Record<string, string> = {
  caatinga:
    "Nota: 'caatinga' é o conjunto de 1.095 municípios marcados como Caatinga no cadastro do banco, não a área do bioma (o banco não diz se é o bioma predominante ou qualquer parte do município, INC-10). Diga isso ao dar o número.",
  MG_SUDENE:
    "Nota: MG_SUDENE é só a parte de Minas Gerais na área da Sudene (249 de 853 municípios), não o estado inteiro. Diga isso ao dar o número.",
  ES_SUDENE:
    "Nota: ES_SUDENE é só a parte do Espírito Santo na área da Sudene (31 de 78 municípios), não o estado inteiro. Diga isso ao dar o número.",
};

/** Ressalvas de indicadores frágeis e de recortes de nome enganoso citados na consulta. */
export function notasDeRessalvas(sql: string): string[] {
  const indicadores = [...new Set(indicadoresNoSql(sql).flatMap((id) => RESSALVAS_DOS_INDICADORES[id] ?? []))];
  const recortes = Object.entries(RECORTES_COM_RESSALVA)
    .filter(([codigo]) => sql.includes(`'${codigo}'`))
    .map(([, nota]) => nota);

  return [...indicadores, ...recortes];
}

/**
 * Ranking de taxa por município: o topo é de municípios minúsculos. Na rodada
 * c6-v0 (DF03) o Haiku filtrou os de 100 nascidos vivos ou mais, o que é bom,
 * mas abriu com "o município com a maior mortalidade infantil é Santa Rita",
 * falso sem o filtro (dois municípios tinham 111,1).
 */
const TAXAS_INSTAVEIS = ["mortalidade_infantil"];

export function notasDeRankingDeTaxa(sql: string): string[] {
  const ehRankingDeMunicipio = /tipo\s*=\s*'municipio'/i.test(sql) && /order\s+by/i.test(sql);
  const taxas = indicadoresNoSql(sql).filter((id) => TAXAS_INSTAVEIS.includes(id));
  if (!ehRankingDeMunicipio || !taxas.length) return [];

  return [
    `Nota: ranking de ${taxas.join(", ")} por município: o topo costuma ser de municípios muito pequenos, em que um óbito muda muito a taxa. Se a consulta filtra por tamanho (nascidos vivos), a primeira frase diz o filtro ("entre os municípios com pelo menos N nascidos vivos, o maior é...") e não chama esse município de "o maior" sem o filtro; cite também quais ficam no topo sem o filtro. Sem filtro, avise que são municípios pequenos e ofereça o ranking só com os maiores (ex.: 100 nascidos vivos ou mais) ou a média de vários anos.`,
  ];
}

/**
 * A meta de cada vacina da saída, junto do número. Antes ela só vinha de
 * detalhar_indicador, e o Haiku escreveu "meta não consta" para a tríplice
 * viral 2ª dose, que tem meta de 95% (rodada c6-todas, V02).
 */
const METAS = metasDasVacinas();

export function notasDeMetas(sql: string, linhas: Linhas): string[] {
  if (!indicadoresNoSql(sql).includes("cobertura_vacinal")) return [];
  const vacinas = new Set(linhas.flatMap((l) => Object.values(l)).filter((v): v is string => typeof v === "string" && METAS.has(v)));
  if (!vacinas.size) return [];
  const lista = [...vacinas].map((v) => `${v}: ${METAS.get(v)}`).join("; ");

  return [`Metas de cobertura do PNI das vacinas desta saída: ${lista}. Compare cada vacina com a sua meta.`];
}

/**
 * As classes do Monitor de Secas vêm arredondadas para o modelo; somá-las dá
 * um total com erro de arredondamento. No Ceará em agosto de 2026, 83,9 + 3,9
 * virou "87,8% em seca", e o certo é 87,9% (rodada c17-v1, TR02). Os totais
 * já existem prontos.
 */
const TOTAIS_DE_SECA = ["area_em_seca", "area_seca_moderada_ou_pior", "area_seca_grave_ou_pior"];

export function notasDeClassesDeSeca(sql: string): string[] {
  const ids = indicadoresNoSql(sql);
  if (!ids.includes("monitor_secas") || ids.some((id) => TOTAIS_DE_SECA.includes(id))) return [];

  return [
    `Nota: para o total da área em seca, em seca moderada ou pior, ou em seca grave ou pior, não some as classes desta saída (vêm arredondadas e a soma erra por 0,1): consulte ${TOTAIS_DE_SECA.join(", ")}, que trazem o total pronto.`,
  ];
}

/** Todos os avisos de uma consulta que trouxe linhas. */
export function notasDaConsulta(sql: string, colunas: string[], linhas: Linhas, truncadoPorLimit: boolean): string {
  const notas = [
    ...(SO_INDICE ? sobreOsIndicadores(indicadoresNoSql(sql)) : []),
    ...notasDeIdsDesconhecidos(sql),
    ...notasDosRecortes(sql),
    ...notasDoResultado(sql, colunas, linhas),
    ...notasDeMetas(sql, linhas),
    ...notasDeClassesDeSeca(sql),
    ...notasDeRankingDeTaxa(sql),
    ...notasDeRessalvas(sql),
  ];
  const parciais = indicadoresNoSql(sql).filter((id) => COM_ANO_PARCIAL.has(id));
  if (parciais.length && sql.includes(`'${ANO_EM_CURSO}'`) || (parciais.length && linhas.some((l) => Object.values(l).includes(ANO_EM_CURSO))))
    notas.push(
      `Nota: ${ANO_EM_CURSO} é o ano em curso para ${parciais.join(", ")}: o dado é parcial. Diga isso e, para comparar anos, prefira o último ano fechado.`,
    );
  if (truncadoPorLimit)
    notas.push(
      'Nota: a consulta tem LIMIT. O que não aparece aqui não é zero: antes de escrever "nenhum", "só" ou "todos", conte com outra consulta sem LIMIT.',
    );

  return notas.length ? `\n${notas.join("\n")}` : "";
}

/** Por que uma consulta sem linhas pode ter vindo vazia. */
export function notasDeConsultaVazia(sql: string): string {
  const notas = [...notasDeIdsDesconhecidos(sql)];
  const municipais = indicadoresNoSql(sql).filter((id) => MUNICIPAIS.has(id));
  if (municipais.length)
    notas.push(
      `Nota: ${municipais.join(", ")} só existe por município (não há valor de estado, região ou recorte). Diga isso; se ajudar, mostre os municípios do recorte (maior, menor, quantos acima de um valor).`,
    );
  const recortes = notasDosRecortes(sql);
  if (/'total'/.test(sql) && recortes.length === 0 && /categoria\s*=\s*'total'/i.test(sql))
    notas.push("Nota: este indicador não tem categoria 'total' (cada categoria é um item, como uma vacina ou uma classe de seca). Filtre uma categoria.");

  return notas.map((n) => `\n${n}`).join("");
}

const COLUNAS_DAS_TABELAS: Record<string, string> = {
  indicadores:
    "id, nome, tema, descricao, unidade, casas, agregacao, formula, fonte, origem, periodicidade, primeiro_periodo, ultimo_periodo, periodos, dimensoes, observacao, painel",
  categorias: "indicador, dimensao, ordem, valor, descricao",
  territorios:
    "codigo, nome, nome_sem_acento, nomes_alternativos, tipo, uf, cd_rgint, nm_rgint, cd_rgi, nm_rgi, nordeste, semiarido, caatinga, area_km2, municipios, observacao",
  valores: "indicador, periodo, ano, mes, territorio, sexo, cor_raca, faixa_etaria, categoria, valor",
  valores_com_nomes: "indicador, periodo, ano, mes, territorio, sexo, cor_raca, faixa_etaria, categoria, valor, nome_territorio, tipo_territorio, uf",
};

/** O que acrescentar a um erro de SQL para a próxima consulta sair certa. */
export function dicaDoErro(sql: string, erro: string): string {
  if (!/no such column/i.test(erro)) return "";
  const usadas = Object.keys(COLUNAS_DAS_TABELAS).filter((t) => new RegExp(`\\b${t}\\b`, "i").test(sql));

  return usadas.length ? ` Colunas que existem: ${usadas.map((t) => `${t}(${COLUNAS_DAS_TABELAS[t]})`).join("; ")}.` : "";
}

/**
 * Colunas que o modelo tende a inventar e que só têm um sentido possível.
 * No SEDES, 5 de 13 erros de consulta numa rodada eram "codigo_territorio".
 */
export function corrigirColunasInventadas(sql: string): string {
  return sql.replace(/\bcodigo_territorio\b/g, "territorio").replace(/\bindicador_id\b/g, "indicador");
}
