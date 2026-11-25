/**
 * O catálogo de indicadores como o modelo o vê: resumido no prompt do sistema
 * (catalogoResumido) e completo pela ferramenta detalhar_indicador. Tudo sai
 * das tabelas indicadores e categorias do tabelão, que o npm run tabelao grava
 * a partir de src/tabelao/indicadores.ts.
 */
import { z } from "zod";
import { db, tabela } from "./banco.ts";
import { semAcento } from "../texto.ts";
import { INDICADORES } from "../tabelao/indicadores.ts";
import type { Ferramenta } from "./tipos.ts";

export type IndicadorDoCatalogo = {
  id: string;
  nome: string;
  tema: string;
  descricao: string;
  unidade: string;
  casas: number;
  agregacao: string;
  formula: string;
  fonte: string;
  origem: string;
  periodicidade: string;
  primeiro_periodo: string;
  ultimo_periodo: string;
  periodos: string;
  dimensoes: string | null;
  observacao: string | null;
  painel: string | null;
};

type Categoria = { indicador: string; dimensao: string; ordem: number; valor: string; descricao: string | null };

// INTENTIONAL: o texto (nome, descrição, observação…) vem do código, que vai
// com cada deploy; do tabelão vêm só os períodos e dimensões, que dependem dos
// dados. Assim corrigir uma explicação não exige regerar e copiar o tabelão
// (~2 GB no gamma).
const TEXTO_DO_CODIGO = new Map(INDICADORES.map((i) => [i.id, i]));

function comTextoDoCodigo(linha: IndicadorDoCatalogo): IndicadorDoCatalogo {
  const ind = TEXTO_DO_CODIGO.get(linha.id);
  if (!ind) return linha;

  return {
    ...linha,
    nome: ind.nome,
    tema: ind.tema,
    descricao: ind.descricao,
    formula: ind.formula,
    fonte: ind.fonte,
    observacao: ind.observacao ?? null,
    painel: ind.painel ?? null,
  };
}

export const CATALOGO = (db.prepare("SELECT * FROM indicadores ORDER BY rowid").all() as IndicadorDoCatalogo[]).map(comTextoDoCodigo);
const CATEGORIAS = db.prepare("SELECT * FROM categorias ORDER BY indicador, dimensao, ordem").all() as Categoria[];
export const IDS = new Set(CATALOGO.map((i) => i.id));

const AGREGACAO: Record<string, string> = {
  soma: "estados e recortes = soma dos municípios",
  razao: "estados e recortes = razão das somas (não é média de municípios)",
  municipal: "SÓ POR MUNICÍPIO",
};

/** Dimensões de um indicador, na ordem do catálogo: { sexo: ['Homens', 'Mulheres'], ... }. */
export function dimensoesDe(id: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const c of CATEGORIAS.filter((x) => x.indicador === id)) out.set(c.dimensao, [...(out.get(c.dimensao) ?? []), c.valor]);

  return out;
}

/**
 * Meta de cobertura de cada vacina, tirada da descrição da categoria
 * ("Meta de cobertura: 95%." ou "Sem meta definida."). Ex.: metasDasVacinas().get("BCG") → "90%".
 */
export function metasDasVacinas(): Map<string, string> {
  const metas = new Map<string, string>();
  for (const c of CATEGORIAS.filter((x) => x.indicador === "cobertura_vacinal")) {
    const meta = c.descricao?.match(/Meta de cobertura: (\d+%)/u)?.[1];
    metas.set(c.valor, meta ?? "sem meta definida");
  }

  return metas;
}

function linhaDoCatalogo(i: IndicadorDoCatalogo) {
  const dims = [...dimensoesDe(i.id)].map(([d, vs]) => `${d}: ${vs.join(" | ")}`);
  const partes = [
    `- **${i.id}**: ${i.nome} (${i.unidade}; ${AGREGACAO[i.agregacao]}). Períodos: ${i.periodos}.`,
    dims.length ? `  Recortes: ${dims.join("; ")}.` : "",
    `  ${i.descricao} Fonte: ${i.fonte}.${i.observacao ? ` ${i.observacao}` : ""}`,
  ];

  return partes.filter(Boolean).join("\n");
}

/**
 * EXPERIMENTO (25/11/2026): com DATANE_CATALOGO=indice, o prompt leva só o
 * índice (id, nome, unidade, períodos, recortes) e a descrição, a fonte e as
 * ressalvas de cada indicador vão no resultado de consultar_sql (notas.ts).
 */
export const SO_INDICE = process.env.DATANE_CATALOGO === "indice";

function linhaDoIndice(i: IndicadorDoCatalogo) {
  const dims = [...dimensoesDe(i.id)].map(([d, vs]) => `${d}: ${vs.join(" | ")}`);

  return [`- **${i.id}**: ${i.nome} (${i.unidade}; ${AGREGACAO[i.agregacao]}). Períodos: ${i.periodos}.`, dims.length ? `  Recortes: ${dims.join("; ")}.` : ""]
    .filter(Boolean)
    .join("\n");
}

/** Só o índice do catálogo, por tema (modo DATANE_CATALOGO=indice). */
export function catalogoIndice() {
  const temas = [...new Set(CATALOGO.map((i) => i.tema))];

  return temas.map((t) => `### ${t}\n\n${CATALOGO.filter((i) => i.tema === t).map(linhaDoIndice).join("\n")}`).join("\n\n");
}

/** O que cada indicador mede, a fonte e as ressalvas, para ir junto da consulta. */
export function sobreOsIndicadores(ids: string[]): string[] {
  return ids.flatMap((id) => {
    const i = CATALOGO.find((x) => x.id === id);

    return i ? [`Sobre ${i.id}: ${i.descricao} Fonte: ${i.fonte}.${i.observacao ? ` Ressalvas: ${i.observacao}` : ""}`] : [];
  });
}

/** O catálogo inteiro, agrupado por tema, para o prompt do sistema (~12 mil caracteres). */
export function catalogoResumido() {
  const temas = [...new Set(CATALOGO.map((i) => i.tema))];

  return temas
    .map((t) => `### ${t}\n\n${CATALOGO.filter((i) => i.tema === t).map(linhaDoCatalogo).join("\n")}`)
    .join("\n\n");
}

/** Ids de indicador escritos numa consulta (os literais que são ids do catálogo). */
export function indicadoresNoSql(sql: string): string[] {
  const literais = [...new Set((sql.match(/'[^']+'/g) ?? []).map((t) => t.slice(1, -1)))];

  return literais.filter((l) => IDS.has(l));
}

/**
 * Indicadores sem painel no portal: o botão leva à fonte original, para a
 * pessoa conferir o número em algum lugar (o portal não tem painel de seca;
 * buscado em conteudo_do_portal em 24/11/2026).
 */
const FONTE_SEM_PAINEL: Record<string, { url: string; titulo: string }> = Object.fromEntries(
  ["monitor_secas", "area_em_seca", "area_seca_moderada_ou_pior", "area_seca_grave_ou_pior"].map((id) => [
    id,
    { url: "https://monitordesecas.ana.gov.br/", titulo: "Monitor de Secas (ANA), a fonte original" },
  ]),
);

/**
 * O nome de cada painel no botão. Pelo tema, dois painéis do mesmo tema saíam
 * com o mesmo nome (esgoto e lixo: "Painel de saneamento" duas vezes, conversa
 * fe633356). Desde 25/11/2026 o portal.json traz o nome que o portal mostra
 * ("Domicílios por destino de lixo"), mas no botão vale o nome curto e simples
 * daqui. Painel que não estiver aqui sai pelo tema.
 */
const NOMES_DOS_PAINEIS: Record<string, string> = {
  analfabetismo: "Painel de analfabetismo",
  cisternas: "Painel de cisternas",
  idhm: "Painel do IDHM",
  imunizacao: "Painel de vacinação",
  lixo: "Painel de coleta de lixo",
  mortalidade: "Painel de mortalidade",
  pib: "Painel do PIB",
  populacao: "Painel de população",
  populacaorua: "Painel da população em situação de rua",
  saneamento: "Painel de esgotamento sanitário",
};

function nomeDoPainel(url: string, tema: string): string {
  const nome = NOMES_DOS_PAINEIS[url.split("/data-panel/")[1] ?? ""];

  return nome ? `${nome} no Data Nordeste` : `Painel de ${tema.toLowerCase()} no Data Nordeste`;
}

/** Os painéis do portal dos indicadores consultados, para o botão da página (no máximo 2). */
export function paineisDasConsultas(consultas: string[]): Array<{ url: string; titulo: string }> {
  const vistos = new Map<string, string>();
  for (const sql of consultas)
    for (const id of indicadoresNoSql(sql)) {
      const i = CATALOGO.find((x) => x.id === id);
      if (i?.painel && !vistos.has(i.painel)) vistos.set(i.painel, nomeDoPainel(i.painel, i.tema));
      const fonte = FONTE_SEM_PAINEL[id];
      if (!i?.painel && fonte && !vistos.has(fonte.url)) vistos.set(fonte.url, fonte.titulo);
    }

  return [...vistos].slice(0, 2).map(([url, titulo]) => ({ url, titulo }));
}

function detalhar(id: string): string {
  const i = CATALOGO.find((x) => x.id === id);
  if (!i) {
    const alvo = semAcento(id);
    const parecidos = CATALOGO.filter((x) => semAcento(`${x.id} ${x.nome}`).includes(alvo.split(" ")[0] ?? "")).map((x) => x.id);

    return `Não existe indicador "${id}". ${parecidos.length ? `Parecidos: ${parecidos.slice(0, 6).join(", ")}.` : "Veja o catálogo no prompt."}`;
  }
  const cats = CATEGORIAS.filter((c) => c.indicador === id);
  const linhas = [
    `${i.nome} (id ${i.id}), tema ${i.tema}.`,
    `O que mede: ${i.descricao}`,
    `Unidade: ${i.unidade}. Casas decimais ao responder: ${i.casas}.`,
    `Fórmula: ${i.formula}. Agregação: ${AGREGACAO[i.agregacao]}.`,
    `Períodos: ${i.periodos} (${i.periodicidade}).`,
    `Fonte: ${i.fonte}. No banco do portal: ${i.origem}.`,
    i.observacao ? `Ressalvas: ${i.observacao}` : "",
    i.painel ? `Painel no portal: ${i.painel}` : "Não há painel deste indicador no portal.",
  ].filter(Boolean);
  if (cats.length) linhas.push("", "Recortes (dimensão | valor | descrição):", tabela(["dimensao", "valor", "descricao"], cats));

  return linhas.join("\n");
}

export const detalharIndicador: Ferramenta = {
  nome: "detalhar_indicador",
  titulo: "Detalhar um indicador do catálogo",
  descricao:
    "Ficha completa de um indicador: o que mede, fórmula, unidade, períodos, fonte, ressalvas e a lista de recortes com descrição (por exemplo, o público-alvo e a meta de cada vacina). O catálogo resumido já está no prompt; use esta ferramenta para perguntas sobre como um indicador é calculado ou sobre as categorias.",
  entrada: {
    id: z.string().min(2).describe("Id do indicador no catálogo, ex.: 'cobertura_vacinal'"),
  },
  async executar({ id }: { id: string }) {
    return detalhar(id.trim());
  },
};
