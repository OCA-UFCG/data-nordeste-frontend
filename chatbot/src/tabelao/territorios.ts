/**
 * O cadastro de territórios do tabelão: os 2.074 municípios da área de atuação
 * da Sudene e os recortes que o tabelão calcula a partir deles.
 *
 * Fonte: carac_mun.auxiliar (aas_21 = 'Sim'), a mesma base que a
 * vw_monitor_seca usa, com o nome de carac_mun.novos_nomes (como as views do
 * portal mostram) e a área de carac_mun.caracteristicas_municipais. Em
 * 23/11/2026 as colunas de recorte (UF, Nordeste, Semiárido, Caatinga, área da
 * Sudene, regiões) batiam nas 10 views usadas; só três nomes divergiam (INC-4),
 * e a outra grafia vai em nomes_alternativos.
 *
 * Minas Gerais e Espírito Santo têm só parte dos municípios na área da Sudene:
 * em vez de um "MG" que seria lido como o estado inteiro, o recorte se chama
 * MG_SUDENE / ES_SUDENE e o nome diz quantos municípios entram. O mesmo vale
 * para as regiões intermediárias e imediatas que cruzam a fronteira da área.
 */
import type pg from "pg";
import { semAcento } from "../texto.ts";

export type Territorio = {
  codigo: string;
  nome: string;
  tipo: string;
  uf: string | null;
  cd_rgint: string | null;
  nm_rgint: string | null;
  cd_rgi: string | null;
  nm_rgi: string | null;
  nordeste: number | null;
  semiarido: number | null;
  caatinga: number | null;
  area_km2: number | null;
  municipios: number | null;
  observacao: string | null;
};

type LinhaMunicipio = {
  codigo: string;
  nome: string;
  nome_cadastro: string;
  uf: string;
  nome_uf: string;
  cd_rgint: string;
  nm_rgint: string;
  cd_rgi: string;
  nm_rgi: string;
  nordeste: boolean;
  semiarido: boolean;
  caatinga: boolean;
  area_km2: string | null;
};

const SQL_MUNICIPIOS = `
SELECT a.cd_mun::text AS codigo, COALESCE(n.nm_mun, a.nm_mun) AS nome, a.nm_mun AS nome_cadastro,
  a.sigla_uf AS uf, a.uf AS nome_uf, a.cd_rgint::text AS cd_rgint, a.nm_rgint,
  a.cd_rgi::text AS cd_rgi, a.nm_rgi, a.ne = 'Sim' AS nordeste, a.semi_21 = 'Sim' AS semiarido,
  a.caat_25 = 'Sim' AS caatinga, c.area AS area_km2
FROM carac_mun.auxiliar a
LEFT JOIN carac_mun.novos_nomes n ON n.cd_mun::text = a.cd_mun::text
LEFT JOIN carac_mun.caracteristicas_municipais c ON c.cd_mun::int = a.cd_mun
WHERE a.aas_21 = 'Sim'
ORDER BY a.cd_mun`;

// Quantos municípios cada UF e região tem no Brasil todo, para dizer quando o
// recorte da área da Sudene pega só uma parte.
const SQL_TAMANHOS = `
SELECT 'uf' AS nivel, sigla_uf AS codigo, count(*)::int AS n FROM carac_mun.caracteristicas_municipais GROUP BY sigla_uf
UNION ALL SELECT 'rgint', cd_rgint::text, count(*)::int FROM carac_mun.caracteristicas_municipais GROUP BY cd_rgint
UNION ALL SELECT 'rgi', cd_rgi::text, count(*)::int FROM carac_mun.caracteristicas_municipais GROUP BY cd_rgi`;

const RECORTES: Array<{ codigo: string; nome: string; filtro: (m: LinhaMunicipio) => boolean; observacao: string }> = [
  {
    codigo: "area_sudene",
    nome: "Área de atuação da Sudene",
    filtro: () => true,
    observacao: "Os 9 estados do Nordeste e parte de Minas Gerais e do Espírito Santo (delimitação de 2021).",
  },
  {
    codigo: "nordeste",
    nome: "Nordeste",
    filtro: (m) => m.nordeste,
    observacao: "Os 9 estados da região Nordeste.",
  },
  {
    codigo: "semiarido",
    nome: "Semiárido",
    filtro: (m) => m.semiarido,
    observacao: "Municípios do Semiárido (delimitação de 2021), inclusive os de Minas Gerais.",
  },
  {
    codigo: "caatinga",
    nome: "Caatinga",
    filtro: (m) => m.caatinga,
    observacao:
      "Municípios marcados como Caatinga no cadastro do banco (coluna caat_25). O banco não documenta se é bioma predominante ou qualquer parte do município (INC-10).",
  },
];

const soma = (ms: LinhaMunicipio[]) =>
  ms.reduce((t, m) => t + (m.area_km2 === null ? 0 : Number(m.area_km2)), 0);

function municipio(m: LinhaMunicipio): Territorio {
  return {
    codigo: m.codigo,
    nome: m.nome,
    tipo: "municipio",
    uf: m.uf,
    cd_rgint: m.cd_rgint,
    nm_rgint: m.nm_rgint,
    cd_rgi: m.cd_rgi,
    nm_rgi: m.nm_rgi,
    nordeste: Number(m.nordeste),
    semiarido: Number(m.semiarido),
    caatinga: Number(m.caatinga),
    area_km2: m.area_km2 === null ? null : Number(m.area_km2),
    municipios: null,
    observacao: null,
  };
}

function agregado(
  codigo: string,
  nome: string,
  tipo: string,
  membros: LinhaMunicipio[],
  observacao: string | null,
): Territorio {
  const ufs = [...new Set(membros.map((m) => m.uf))];
  return {
    codigo,
    nome,
    tipo,
    uf: ufs.length === 1 ? ufs[0] : null,
    cd_rgint: null,
    nm_rgint: null,
    cd_rgi: null,
    nm_rgi: null,
    nordeste: null,
    semiarido: null,
    caatinga: null,
    area_km2: soma(membros),
    municipios: membros.length,
    observacao,
  };
}

const agrupar = <T>(lista: T[], chave: (x: T) => string) => {
  const grupos = new Map<string, T[]>();
  for (const x of lista) grupos.set(chave(x), [...(grupos.get(chave(x)) ?? []), x]);

  return grupos;
};

/** "parte na área da Sudene: 2 de 146 municípios", ou nada se a região inteira entra. */
const parcial = (dentro: number, total: number | undefined) =>
  total && dentro < total ? `parte na área da Sudene: ${dentro} de ${total} municípios` : null;

export type Cadastro = {
  territorios: Territorio[];
  membros: Array<[string, string]>;
  /** Nome do cadastro, quando difere do nome usado (vira nome alternativo). */
  outrosNomes: Map<string, Set<string>>;
};

export async function lerCadastro(cliente: pg.Client): Promise<Cadastro> {
  const municipios = (await cliente.query<LinhaMunicipio>(SQL_MUNICIPIOS)).rows;
  const tamanhos = new Map(
    (await cliente.query<{ nivel: string; codigo: string; n: number }>(SQL_TAMANHOS)).rows.map((r) => [
      `${r.nivel}:${r.codigo}`,
      r.n,
    ]),
  );
  const territorios: Territorio[] = municipios.map(municipio);
  const membros: Array<[string, string]> = [];
  const juntar = (t: Territorio, ms: LinhaMunicipio[]) => {
    territorios.push(t);
    for (const m of ms) membros.push([t.codigo, m.codigo]);
  };

  for (const r of RECORTES) {
    const ms = municipios.filter(r.filtro);
    juntar(agregado(r.codigo, r.nome, "recorte", ms, r.observacao), ms);
  }
  for (const [uf, ms] of agrupar(municipios, (m) => m.uf)) {
    const nota = parcial(ms.length, tamanhos.get(`uf:${uf}`));
    const t = nota
      ? agregado(`${uf}_SUDENE`, `${ms[0].nome_uf} (${nota})`, "estado_parcial", ms, `Só os municípios de ${ms[0].nome_uf} na área da Sudene; não é o estado inteiro.`)
      : agregado(uf, ms[0].nome_uf, "estado", ms, null);
    juntar(t, ms);
  }
  for (const [cd, ms] of agrupar(municipios, (m) => m.cd_rgint)) {
    const nota = parcial(ms.length, tamanhos.get(`rgint:${cd}`));
    const nome = `Região intermediária de ${ms[0].nm_rgint}${nota ? ` (${nota})` : ""}`;
    juntar(agregado(`rgint_${cd}`, nome, "regiao_intermediaria", ms, nota), ms);
  }
  for (const [cd, ms] of agrupar(municipios, (m) => m.cd_rgi)) {
    const nota = parcial(ms.length, tamanhos.get(`rgi:${cd}`));
    const nome = `Região imediata de ${ms[0].nm_rgi}${nota ? ` (${nota})` : ""}`;
    juntar(agregado(`rgi_${cd}`, nome, "regiao_imediata", ms, nota), ms);
  }
  territorios.push({
    ...agregado("brasil", "Brasil", "pais", [], "Só há valor do Brasil quando a fonte traz o total do país (hoje, mortalidade infantil, nascidos vivos e óbitos infantis)."),
    area_km2: null,
    municipios: null,
  });

  const outrosNomes = new Map<string, Set<string>>();
  for (const m of municipios)
    if (m.nome_cadastro !== m.nome) outrosNomes.set(m.codigo, new Set([m.nome_cadastro]));

  return { territorios, membros, outrosNomes };
}

export const nomeSemAcento = (t: Territorio) => semAcento(t.nome);
