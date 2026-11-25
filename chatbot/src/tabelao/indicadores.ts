/**
 * O catálogo do tabelão: o que o assistente sabe e como cada número é feito.
 *
 * É a "camada curada" da proposta. Cada indicador diz de qual view do oca_db
 * vem, a fórmula e a regra de agregação. O script (montar-tabelao.ts) lê as
 * views só com SELECT, calcula estados, regiões e recortes com essas regras e
 * grava tudo pronto no SQLite. O modelo só lê valores prontos; não soma
 * municípios nem tira média de taxa.
 *
 * Regras de agregação:
 *   soma       valor do recorte = soma dos municípios (contagens, R$).
 *   razao      valor = fator × Σ numerador ÷ Σ denominador, somando antes de
 *              dividir (taxas e percentuais). Município com denominador 0 ou
 *              vazio fica de fora das duas somas e não tem valor próprio.
 *   municipal  só existe por município (IDHM, Gini): não há regra honesta para
 *              estados e recortes, e o tabelão não inventa uma.
 *
 * Para mudar um texto do catálogo, edite aqui e rode `npm run tabelao`.
 * Inconsistências do banco que motivaram uma regra estão em
 * docs/inconsistencias-do-banco.md (citadas aqui como "INC-n").
 */

import { CONSULTAS_AMPLIACAO, INDICADORES_AMPLIACAO } from "./indicadores-ampliacao.ts";

export type Dimensao = "sexo" | "cor_raca" | "faixa_etaria" | "categoria";
export const DIMENSOES: Dimensao[] = ["sexo", "cor_raca", "faixa_etaria", "categoria"];

/** Um SELECT nas views do oca_db. Toda consulta devolve cd_mun, nm_mun, ano e mes. */
export type Consulta = {
  id: string;
  /** Views lidas (vai para o catálogo como "origem"). */
  origem: string;
  /** cd_mun inteiro (0 = Brasil), nm_mun, ano inteiro, mes (inteiro ou nulo), as dimensões e as medidas. */
  sql: string;
  /** Colunas de dimensão que a consulta devolve (as outras ficam 'total'). */
  dimensoes: Dimensao[];
  /** Colunas numéricas. */
  medidas: string[];
};

/**
 * Uma linha do indicador: as expressões (SQL do SQLite sobre as medidas da
 * consulta) e, opcionalmente, o recorte que ela representa. Um indicador com
 * várias linhas desdobra uma consulta "larga" (ex.: uma coluna por destino do
 * lixo) em categorias.
 */
export type Linha = {
  recorte?: Partial<Record<Dimensao, string>>;
  numerador: string;
  denominador?: string;
};

export type Agregacao = "soma" | "razao" | "municipal";

export type Indicador = {
  id: string;
  nome: string;
  tema: string;
  /** Uma a três frases: o que mede, para quem, de onde vem. */
  descricao: string;
  unidade: string;
  /** Casas decimais ao responder. */
  casas: number;
  consulta: string;
  agregacao: Agregacao;
  linhas: Linha[];
  /** Multiplicador da razão (100 para %, 1000 para "por mil"). */
  fator?: number;
  /** Fórmula legível, para o catálogo. */
  formula: string;
  /** Dimensões que ganham a linha 'total' (soma de todas as categorias). */
  totais?: Dimensao[];
  fonte: string;
  /** Ressalvas que o modelo precisa dizer ou respeitar. */
  observacao?: string;
  /** Caminho do painel no portal. */
  painel?: string;
};

// ---------------------------------------------------------------------------
// Consultas ao oca_db (só SELECT; nenhuma lógica de negócio além de renomear)

export const CONSULTAS: Consulta[] = [
  {
    id: "demografia",
    origem: "dem_demografia.final_demografia",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      idade_agrupada AS faixa_etaria, populacao_total, mulher, homem,
      branca, preta, amarela, parda, indigena
      FROM dem_demografia.final_demografia`,
    dimensoes: ["faixa_etaria"],
    medidas: ["populacao_total", "mulher", "homem", "branca", "preta", "amarela", "parda", "indigena"],
  },
  {
    id: "densidade",
    origem: "dem_demografia.final_demografia, carac_mun.caracteristicas_municipais",
    sql: `SELECT d.cd_mun::int AS cd_mun, d.nm_mun, d.ano::int AS ano, NULL::int AS mes,
      SUM(d.populacao_total) AS pessoas, MAX(c.area) AS area_km2
      FROM dem_demografia.final_demografia d
      JOIN carac_mun.caracteristicas_municipais c ON c.cd_mun::int = d.cd_mun::int
      GROUP BY 1, 2, 3`,
    dimensoes: [],
    medidas: ["pessoas", "area_km2"],
  },
  {
    id: "pib",
    origem: "eco_pib.vw_pib",
    // INC-6: pib e vab_* estão em R$ mil; pib_total, em R$. Tudo sai em R$.
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      pib_total, pib_per_capita,
      vab_agropecuaria * 1000 AS vab_agro, vab_industria * 1000 AS vab_ind,
      vab_servicos * 1000 AS vab_serv, vab_adm_publica * 1000 AS vab_adm,
      impostos_liquidos * 1000 AS impostos
      FROM eco_pib.vw_pib`,
    dimensoes: [],
    medidas: ["pib_total", "pib_per_capita", "vab_agro", "vab_ind", "vab_serv", "vab_adm", "impostos"],
  },
  {
    id: "idhm",
    origem: "des_idhm.vw_idhm",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      idhm, idhm_renda, idhm_longevidade, idhm_educacao, indice_gini, renda_per_capita
      FROM des_idhm.vw_idhm`,
    dimensoes: [],
    medidas: ["idhm", "idhm_renda", "idhm_longevidade", "idhm_educacao", "indice_gini", "renda_per_capita"],
  },
  {
    id: "analfabetismo",
    origem: "edu_analfabetismo.vw_analfabetismo",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      sexo, cor_ou_raca AS cor_raca, faixa_etaria, total, nao_alfabetizadas
      FROM edu_analfabetismo.vw_analfabetismo`,
    dimensoes: ["sexo", "cor_raca", "faixa_etaria"],
    medidas: ["total", "nao_alfabetizadas"],
  },
  {
    id: "mortalidade",
    origem: "sau_mortalidade.vw_mortalidade",
    // INC-1: a view traz uma linha 'Brasil' com cd_mun = 0; o tabelão a grava
    // como o território 'brasil' e a deixa fora das somas.
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      nascidos, obitos_infantis
      FROM sau_mortalidade.vw_mortalidade`,
    dimensoes: [],
    medidas: ["nascidos", "obitos_infantis"],
  },
  {
    id: "imunizacao",
    origem: "sau_imunizacao.vw_imunizacao_anual",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      vacina AS categoria, populacao AS publico_alvo, doses_aplicadas
      FROM sau_imunizacao.vw_imunizacao_anual`,
    dimensoes: ["categoria"],
    medidas: ["publico_alvo", "doses_aplicadas"],
  },
  {
    id: "rua",
    origem: "dem_rua.vw_pop",
    // INC-9: em 2022 todos os municípios têm num_centro_pop = 0; é falta de
    // dado (há 68 centros em 2023), então 2022 fica vazio.
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      numero_pessoas_situacao_rua_cadunico AS pessoas,
      total_familias_situacao_rua_cadunico AS familias,
      criancas_adolescentes_situacao_rua AS criancas,
      idosos_em_situacao_de_rua AS idosos,
      pcd_em_situacao_de_rua AS pcd,
      familias_situacao_rua_beneficiarias_bolsa_familia AS familias_bolsa_familia,
      qtd_pobreza_cadunico AS renda_pobreza,
      qtd_baixa_renda_cadunico AS renda_baixa,
      qtd_acima_meio_salario_minimo_cadunico AS renda_acima,
      CASE WHEN ano > 2022 THEN num_centro_pop END AS centros_pop
      FROM dem_rua.vw_pop`,
    dimensoes: [],
    medidas: ["pessoas", "familias", "criancas", "idosos", "pcd", "familias_bolsa_familia", "renda_pobreza", "renda_baixa", "renda_acima", "centros_pop"],
  },
  {
    id: "cisternas",
    origem: "hidr_cisternas.view_cisternas_todos_anos",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      tot_cisternas, i_agua_total, ii_agua, escolares
      FROM hidr_cisternas.view_cisternas_todos_anos`,
    dimensoes: [],
    medidas: ["tot_cisternas", "i_agua_total", "ii_agua", "escolares"],
  },
  {
    id: "lixo",
    origem: "infra_destino_lixo.destinacao_lixo_geral_view",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes, total,
      coletado_por_servico_de_limpeza AS coletado,
      depositado_em_cacamba_de_servico_de_limpeza AS cacamba,
      queimado_na_propriedade AS queimado,
      enterrado_na_propriedade AS enterrado,
      jogado_em_terreno_baldio_ou_encosta_ou_area_publica AS terreno_baldio,
      outro_destino AS outro
      FROM infra_destino_lixo.destinacao_lixo_geral_view`,
    dimensoes: [],
    medidas: ["total", "coletado", "cacamba", "queimado", "enterrado", "terreno_baldio", "outro"],
  },
  {
    id: "esgoto",
    origem: "infra_esgotamento_sanitario.esgotamento_sanitario_geral",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes, total,
      rede_geral_ou_pluvial AS rede, fossa_septica_ou_fossa_filtro AS fossa_septica,
      fossa_rudimentar_ou_buraco AS fossa_rudimentar, vala, rio_lago_corrego_ou_mar AS rio,
      outra_forma AS outra, nao_tinham_banheiro_e_ou_sanitario AS sem_banheiro
      FROM infra_esgotamento_sanitario.esgotamento_sanitario_geral`,
    dimensoes: [],
    medidas: ["total", "rede", "fossa_septica", "fossa_rudimentar", "vala", "rio", "outra", "sem_banheiro"],
  },
  {
    id: "seca",
    origem: "meio_seco.monitor_seca_municipal, meio_seco.classe_seca, carac_mun.auxiliar",
    // A tabela só tem linha para as classes presentes, e em ~5,5% dos
    // município-mês as classes não cobrem a área toda (INC-11). A grade
    // completa (todas as classes, com 0) e a classe "Sem informação" com a
    // sobra fazem as categorias somarem 100% e a soma dos recortes ficar certa.
    // Lê a tabela, não a vw_monitor_seca: a view junta por texto com cast e
    // passa de 30 s (INC-12).
    sql: `WITH sudene AS (SELECT cd_mun::text AS cd FROM carac_mun.auxiliar WHERE aas_21 = 'Sim'),
      m AS (SELECT d.cd_mun, d.nm_mun, d.ano_mes, d.ano, d.mes,
              MAX(d.area_municipio_km2) AS area_mun, SUM(d.area_classe_km2) AS soma
            FROM meio_seco.monitor_seca_municipal d JOIN sudene s ON s.cd = d.cd_mun
            GROUP BY 1, 2, 3, 4, 5)
      SELECT m.cd_mun::int AS cd_mun, m.nm_mun, m.ano::int AS ano, m.mes::int AS mes,
        CASE c.classe_seca WHEN 'SI' THEN 'Sem seca relativa' ELSE c.classe_seca || ' – ' || c.significado END AS categoria,
        COALESCE(d.area_classe_km2, 0) AS area_classe, m.area_mun
      FROM m CROSS JOIN meio_seco.classe_seca c
      LEFT JOIN meio_seco.monitor_seca_municipal d
        ON d.cd_mun = m.cd_mun AND d.ano_mes = m.ano_mes AND d.classe_seca = c.classe_seca
      UNION ALL
      SELECT m.cd_mun::int, m.nm_mun, m.ano::int, m.mes::int, 'Sem informação',
        GREATEST(m.area_mun - m.soma, 0), m.area_mun
      FROM m`,
    dimensoes: ["categoria"],
    medidas: ["area_classe", "area_mun"],
  },
  {
    id: "seca_total",
    origem: "meio_seco.monitor_seca_municipal, carac_mun.auxiliar",
    sql: `SELECT d.cd_mun::int AS cd_mun, d.nm_mun, d.ano::int AS ano, d.mes::int AS mes,
      COALESCE(SUM(d.area_classe_km2) FILTER (WHERE d.valor >= 0), 0) AS area_s0,
      COALESCE(SUM(d.area_classe_km2) FILTER (WHERE d.valor >= 1), 0) AS area_s1,
      COALESCE(SUM(d.area_classe_km2) FILTER (WHERE d.valor >= 2), 0) AS area_s2,
      MAX(d.area_municipio_km2) AS area_mun
      FROM meio_seco.monitor_seca_municipal d
      JOIN carac_mun.auxiliar a ON a.cd_mun::text = d.cd_mun AND a.aas_21 = 'Sim'
      GROUP BY d.cd_mun, d.nm_mun, d.ano, d.mes`,
    dimensoes: [],
    medidas: ["area_s0", "area_s1", "area_s2", "area_mun"],
  },
  ...CONSULTAS_AMPLIACAO,
];

// ---------------------------------------------------------------------------
// Indicadores

const PORTAL = "https://datanordeste.sudene.gov.br";
const painel = (id: string) => `${PORTAL}/data-panel/${id}`;
const CENSO = "Censo Demográfico (IBGE)";

/** Indicador de uma linha só, sem recorte. */
const uma = (numerador: string, denominador?: string): Linha[] => [
  { numerador, ...(denominador ? { denominador } : {}) },
];

const cat = (categoria: string, numerador: string, denominador?: string): Linha => ({
  recorte: { categoria },
  numerador,
  ...(denominador ? { denominador } : {}),
});

const DEMOGRAFIA: Indicador[] = [
  {
    id: "populacao",
    nome: "População residente",
    tema: "Demografia",
    descricao:
      "Pessoas residentes no município na data do Censo, por faixa etária, sexo e cor ou raça.",
    unidade: "pessoas",
    casas: 0,
    consulta: "demografia",
    agregacao: "soma",
    linhas: [
      { numerador: "populacao_total" },
      { recorte: { sexo: "Mulheres" }, numerador: "mulher" },
      { recorte: { sexo: "Homens" }, numerador: "homem" },
      { recorte: { cor_raca: "Branca" }, numerador: "branca" },
      { recorte: { cor_raca: "Preta" }, numerador: "preta" },
      { recorte: { cor_raca: "Amarela" }, numerador: "amarela" },
      { recorte: { cor_raca: "Parda" }, numerador: "parda" },
      { recorte: { cor_raca: "Indígena" }, numerador: "indigena" },
    ],
    totais: ["faixa_etaria"],
    formula: "contagem de pessoas",
    fonte: CENSO,
    observacao:
      "Censos de 2000, 2010 e 2022. Sexo e cor ou raça não se cruzam (não há 'mulheres pardas'): filtre um dos dois e deixe o outro em 'total'. Em 2000 há 2.066 municípios (8 foram criados depois). 'Indígena' aqui é a cor ou raça declarada; o Censo 2022 também conta como indígena quem se considera indígena, o que dá um número maior (é o do card de população indígena do portal).",
    painel: painel("populacao"),
  },
  {
    id: "densidade_demografica",
    nome: "Densidade demográfica",
    tema: "Demografia",
    descricao: "Habitantes por km² de área do território.",
    unidade: "hab/km²",
    casas: 1,
    consulta: "densidade",
    agregacao: "razao",
    linhas: uma("pessoas", "area_km2"),
    formula: "população ÷ área em km²",
    fonte: `${CENSO}; área do cadastro de municípios do banco`,
    observacao: "Usa a área atual do município para todos os anos.",
    painel: painel("populacao"),
  },
];

const ECONOMIA: Indicador[] = [
  {
    id: "pib",
    nome: "Produto Interno Bruto (PIB)",
    tema: "Economia",
    descricao: "PIB a preços correntes: tudo o que foi produzido no território no ano.",
    unidade: "R$",
    casas: 0,
    consulta: "pib",
    agregacao: "soma",
    linhas: uma("pib_total"),
    formula: "soma do PIB dos municípios",
    fonte: "PIB dos Municípios (IBGE)",
    observacao:
      "Anos 2010 a 2023, em reais correntes (sem correção pela inflação: não compare anos como se fosse crescimento real). Escreva em mil, milhões, bilhões ou trilhões.",
    painel: painel("pib"),
  },
  {
    id: "pib_per_capita",
    nome: "PIB per capita",
    tema: "Economia",
    descricao: "PIB dividido pela população do território.",
    unidade: "R$ por habitante",
    casas: 2,
    consulta: "pib",
    agregacao: "razao",
    linhas: uma("pib_total", "pib_total / pib_per_capita"),
    formula: "Σ PIB ÷ Σ população usada pelo IBGE no cálculo",
    fonte: "PIB dos Municípios (IBGE)",
    observacao:
      "Reais correntes. Em 2022 e 2023 a população do denominador é a do Censo 2022 nos dois anos (INC-7). Município com refinaria ou grande indústria e pouca gente tem PIB per capita muito alto (ex.: São Francisco do Conde–BA): o número não é renda das pessoas.",
    painel: painel("pib"),
  },
  {
    id: "valor_adicionado",
    nome: "Valor adicionado bruto por setor",
    tema: "Economia",
    descricao: "Quanto cada setor da economia gerou no ano (o PIB é a soma dos setores mais os impostos).",
    unidade: "R$",
    casas: 0,
    consulta: "pib",
    agregacao: "soma",
    linhas: [
      cat("Agropecuária", "vab_agro"),
      cat("Indústria", "vab_ind"),
      cat("Serviços (exceto administração pública)", "vab_serv"),
      cat("Administração pública", "vab_adm"),
    ],
    totais: ["categoria"],
    formula: "soma do valor adicionado dos municípios",
    fonte: "PIB dos Municípios (IBGE)",
    observacao: "Só de 2010 a 2021: no banco, o valor por setor de 2022 e 2023 está vazio (INC-8).",
    painel: painel("pib"),
  },
  {
    id: "participacao_setor",
    nome: "Participação do setor no valor adicionado",
    tema: "Economia",
    descricao: "Fatia de cada setor no valor adicionado total do território.",
    unidade: "% do valor adicionado",
    casas: 1,
    consulta: "pib",
    agregacao: "razao",
    fator: 100,
    linhas: [
      cat("Agropecuária", "vab_agro", "vab_agro + vab_ind + vab_serv + vab_adm"),
      cat("Indústria", "vab_ind", "vab_agro + vab_ind + vab_serv + vab_adm"),
      cat("Serviços (exceto administração pública)", "vab_serv", "vab_agro + vab_ind + vab_serv + vab_adm"),
      cat("Administração pública", "vab_adm", "vab_agro + vab_ind + vab_serv + vab_adm"),
    ],
    formula: "100 × valor adicionado do setor ÷ soma dos quatro setores",
    fonte: "PIB dos Municípios (IBGE)",
    observacao: "Só de 2010 a 2021 (INC-8).",
    painel: painel("pib"),
  },
];

const DESENVOLVIMENTO: Indicador[] = [
  ["idhm", "Índice de Desenvolvimento Humano Municipal (IDHM)", "Combina renda, educação e longevidade; vai de 0 a 1 (quanto maior, melhor).", "idhm"],
  ["idhm_renda", "IDHM Renda", "Componente de renda do IDHM; de 0 a 1.", "idhm_renda"],
  ["idhm_longevidade", "IDHM Longevidade", "Componente de longevidade (esperança de vida) do IDHM; de 0 a 1.", "idhm_longevidade"],
  ["idhm_educacao", "IDHM Educação", "Componente de educação do IDHM; de 0 a 1.", "idhm_educacao"],
  ["indice_gini", "Índice de Gini da renda", "Desigualdade de renda entre as pessoas do município; de 0 (todos iguais) a 1 (um só tem tudo).", "indice_gini"],
].map(
  ([id, nome, descricao, coluna]): Indicador => ({
    id,
    nome,
    tema: "Desenvolvimento humano",
    descricao,
    unidade: "índice de 0 a 1",
    casas: 3,
    consulta: "idhm",
    agregacao: "municipal",
    linhas: uma(coluna),
    formula: "valor do Atlas, por município",
    fonte: "Atlas do Desenvolvimento Humano no Brasil (PNUD, Ipea, FJP)",
    observacao:
      "Só 1991, 2000 e 2010 (o Atlas não tem dado municipal mais recente). Só existe por município: não há valor de estado ou região no banco, e média de municípios não é o índice do estado.",
    painel: painel("idhm"),
  }),
);
DESENVOLVIMENTO.push({
  id: "renda_per_capita",
  nome: "Renda per capita",
  tema: "Desenvolvimento humano",
  descricao: "Renda média mensal por pessoa no município, segundo o Atlas.",
  unidade: "R$ por mês (de agosto de 2010)",
  casas: 2,
  consulta: "idhm",
  agregacao: "municipal",
  linhas: uma("renda_per_capita"),
  formula: "valor do Atlas, por município",
  fonte: "Atlas do Desenvolvimento Humano no Brasil (PNUD, Ipea, FJP)",
  observacao: "Só 1991, 2000 e 2010, em reais de agosto de 2010; só por município.",
  painel: painel("idhm"),
});

const EDUCACAO: Indicador[] = [
  {
    id: "taxa_analfabetismo",
    nome: "Taxa de analfabetismo",
    tema: "Educação",
    descricao:
      "Percentual das pessoas de 15 anos ou mais que não sabem ler e escrever, por sexo, cor ou raça e faixa etária.",
    unidade: "% das pessoas de 15 anos ou mais",
    casas: 2,
    consulta: "analfabetismo",
    agregacao: "razao",
    fator: 100,
    linhas: uma("nao_alfabetizadas", "total"),
    totais: ["sexo", "cor_raca", "faixa_etaria"],
    formula: "100 × não alfabetizadas ÷ pessoas de 15 anos ou mais",
    fonte: CENSO,
    observacao:
      "Censos de 2000, 2010 e 2022. Aqui sexo, cor ou raça e faixa etária se cruzam (ex.: mulheres pretas de 60 anos ou mais). Faixas: 15 a 19, 20 a 29, 30 a 39, 40 a 49, 50 a 59 anos e 60 anos ou mais (diferentes das faixas da população).",
    painel: painel("analfabetismo"),
  },
  {
    id: "pessoas_nao_alfabetizadas",
    nome: "Pessoas de 15 anos ou mais não alfabetizadas",
    tema: "Educação",
    descricao: "Número de pessoas de 15 anos ou mais que não sabem ler e escrever.",
    unidade: "pessoas",
    casas: 0,
    consulta: "analfabetismo",
    agregacao: "soma",
    linhas: uma("nao_alfabetizadas"),
    totais: ["sexo", "cor_raca", "faixa_etaria"],
    formula: "contagem de pessoas",
    fonte: CENSO,
    observacao: "Mesmos recortes da taxa de analfabetismo.",
    painel: painel("analfabetismo"),
  },
  {
    id: "pessoas_15_anos_ou_mais",
    nome: "Pessoas de 15 anos ou mais",
    tema: "Educação",
    descricao: "Base da taxa de analfabetismo: pessoas de 15 anos ou mais.",
    unidade: "pessoas",
    casas: 0,
    consulta: "analfabetismo",
    agregacao: "soma",
    linhas: uma("total"),
    totais: ["sexo", "cor_raca", "faixa_etaria"],
    formula: "contagem de pessoas",
    fonte: CENSO,
    painel: painel("analfabetismo"),
  },
];

const SAUDE: Indicador[] = [
  {
    id: "mortalidade_infantil",
    nome: "Taxa de mortalidade infantil",
    tema: "Saúde",
    descricao: "Óbitos de crianças com menos de 1 ano para cada mil nascidos vivos.",
    unidade: "óbitos por mil nascidos vivos",
    casas: 2,
    consulta: "mortalidade",
    agregacao: "razao",
    fator: 1000,
    linhas: uma("obitos_infantis", "nascidos"),
    formula: "1.000 × óbitos de menores de 1 ano ÷ nascidos vivos",
    fonte: "SIM e Sinasc (DATASUS, Ministério da Saúde)",
    observacao:
      "Anos 2010 e 2020 a 2025. Há valor do Brasil (território 'brasil'). Em município pequeno, um ou dois óbitos mudam muito a taxa: para comparar municípios, prefira os maiores ou olhe vários anos. Município sem registro aparece com 0 na fonte (INC-3).",
    painel: painel("mortalidade"),
  },
  {
    id: "nascidos_vivos",
    nome: "Nascidos vivos",
    tema: "Saúde",
    descricao: "Nascimentos com vida registrados no ano, pelo município de residência da mãe.",
    unidade: "nascimentos",
    casas: 0,
    consulta: "mortalidade",
    agregacao: "soma",
    linhas: uma("nascidos"),
    formula: "contagem",
    fonte: "Sinasc (DATASUS, Ministério da Saúde)",
    observacao: "Anos 2010 e 2020 a 2025. Há valor do Brasil.",
    painel: painel("mortalidade"),
  },
  {
    id: "obitos_infantis",
    nome: "Óbitos infantis",
    tema: "Saúde",
    descricao: "Óbitos de crianças com menos de 1 ano no ano.",
    unidade: "óbitos",
    casas: 0,
    consulta: "mortalidade",
    agregacao: "soma",
    linhas: uma("obitos_infantis"),
    formula: "contagem",
    fonte: "SIM (DATASUS, Ministério da Saúde)",
    observacao: "Anos 2010 e 2020 a 2025. Há valor do Brasil.",
    painel: painel("mortalidade"),
  },
  {
    id: "cobertura_vacinal",
    nome: "Cobertura vacinal",
    tema: "Saúde",
    descricao:
      "Doses aplicadas de cada vacina do calendário infantil em relação ao público-alvo (categoria = vacina).",
    unidade: "% do público-alvo",
    casas: 2,
    consulta: "imunizacao",
    agregacao: "razao",
    fator: 100,
    linhas: uma("doses_aplicadas", "publico_alvo"),
    formula: "100 × doses aplicadas ÷ público-alvo",
    fonte: "Programa Nacional de Imunizações (DATASUS, Ministério da Saúde)",
    observacao:
      "Anos 2023 a 2026; 2026 é o ano em curso, com dado parcial e percentuais que não se comparam aos anos fechados (INC-5). Passar de 100% é comum (vacinação de quem mora em outro município, público-alvo estimado): diga isso quando acontecer. A lista de vacinas muda de um ano para outro. Estados e recortes somam doses e público antes de dividir; não é a média dos municípios.",
    painel: painel("imunizacao"),
  },
  {
    id: "doses_aplicadas",
    nome: "Doses aplicadas",
    tema: "Saúde",
    descricao: "Doses aplicadas de cada vacina do calendário infantil (categoria = vacina).",
    unidade: "doses",
    casas: 0,
    consulta: "imunizacao",
    agregacao: "soma",
    linhas: uma("doses_aplicadas"),
    formula: "contagem",
    fonte: "Programa Nacional de Imunizações (DATASUS, Ministério da Saúde)",
    observacao: "Anos 2023 a 2026 (2026 parcial). Não some vacinas diferentes como se fossem uma: cada uma tem seu público.",
    painel: painel("imunizacao"),
  },
];

const RUA_FONTE = "Cadastro Único (Ministério do Desenvolvimento e Assistência Social)";
const RUA_OBS = "Anos 2022 a 2026; 2026 é o ano em curso (dado parcial). Conta quem está inscrito no CadÚnico, não toda a população em situação de rua.";
const rua = (id: string, nome: string, descricao: string, unidade: string, coluna: string, extra = ""): Indicador => ({
  id,
  nome,
  tema: "Assistência social",
  descricao,
  unidade,
  casas: 0,
  consulta: "rua",
  agregacao: "soma",
  linhas: uma(coluna),
  formula: "contagem",
  fonte: RUA_FONTE,
  observacao: `${RUA_OBS}${extra}`,
  painel: painel("populacaorua"),
});

const ASSISTENCIA: Indicador[] = [
  rua("pessoas_situacao_rua", "Pessoas em situação de rua no CadÚnico", "Pessoas em situação de rua inscritas no Cadastro Único.", "pessoas", "pessoas"),
  rua("familias_situacao_rua", "Famílias em situação de rua no CadÚnico", "Famílias em situação de rua inscritas no Cadastro Único.", "famílias", "familias"),
  // INC-18: os subgrupos não são subconjunto do total na fonte. O número fica,
  // com a ressalva, para o assistente explicar em vez de omitir o tema.
  rua("criancas_situacao_rua", "Crianças e adolescentes em situação de rua", "Crianças e adolescentes em situação de rua no CadÚnico.", "pessoas", "criancas", " NÃO É CONFIÁVEL (INC-18): em 2022 e 2025 centenas de municípios têm mais crianças do que pessoas em situação de rua no total, e o Nordeste fica com 0 em 2023, 2024 e 2026. Ao usar, diga isso e mostre o total de pessoas em situação de rua."),
  rua("idosos_situacao_rua", "Idosos em situação de rua", "Pessoas idosas em situação de rua no CadÚnico.", "pessoas", "idosos", " Em alguns municípios passa do total de pessoas em situação de rua (INC-18): valor de município pede cautela."),
  rua("pcd_situacao_rua", "Pessoas com deficiência em situação de rua", "Pessoas com deficiência em situação de rua no CadÚnico.", "pessoas", "pcd", " Em alguns municípios passa do total de pessoas em situação de rua (INC-18): valor de município pede cautela."),
  rua("familias_rua_bolsa_familia", "Famílias em situação de rua no Bolsa Família", "Famílias em situação de rua que recebem o Bolsa Família.", "famílias", "familias_bolsa_familia"),
  rua("centros_pop", "Centros POP", "Centros de Referência Especializados para População em Situação de Rua (Centros POP).", "unidades", "centros_pop", " Centros POP só de 2023 em diante: 2022 está zerado no banco (INC-9)."),
  {
    id: "familias_rua_por_renda",
    nome: "Famílias em situação de rua por faixa de renda",
    tema: "Assistência social",
    descricao: "Famílias em situação de rua no CadÚnico pela faixa de renda por pessoa (categoria).",
    unidade: "famílias",
    casas: 0,
    consulta: "rua",
    agregacao: "soma",
    linhas: [
      cat("Pobreza", "renda_pobreza"),
      cat("Baixa renda", "renda_baixa"),
      cat("Acima de meio salário mínimo", "renda_acima"),
    ],
    formula: "contagem",
    fonte: RUA_FONTE,
    observacao: `${RUA_OBS} As três faixas somam o total de famílias em situação de rua.`,
    painel: painel("populacaorua"),
  },
];

const CISTERNAS_OBS =
  "Anos 2010 e 2020 a 2026. É o total acumulado de cisternas até o ano (estoque), não as entregues no ano: para saber quantas foram entregues num período, subtraia os dois anos.";
const cisterna = (id: string, nome: string, descricao: string, coluna: string): Indicador => ({
  id,
  nome,
  tema: "Segurança hídrica",
  descricao,
  unidade: "cisternas",
  casas: 0,
  consulta: "cisternas",
  agregacao: "soma",
  linhas: uma(coluna),
  formula: "contagem acumulada",
  fonte: "Programa Cisternas (Ministério do Desenvolvimento e Assistência Social)",
  observacao: CISTERNAS_OBS,
  painel: painel("cisternas"),
});

const AGUA: Indicador[] = [
  cisterna("cisternas", "Cisternas (total)", "Cisternas e tecnologias sociais de acesso à água, de todos os tipos.", "tot_cisternas"),
  cisterna("cisternas_consumo", "Cisternas para consumo humano", "Cisternas de água para beber e cozinhar (primeira água), de todos os programas.", "i_agua_total"),
  cisterna("cisternas_producao", "Cisternas para produção", "Tecnologias de água para produção (segunda água): irrigação de quintais e criação de animais.", "ii_agua"),
  cisterna("cisternas_escolas", "Cisternas em escolas", "Cisternas instaladas em escolas rurais.", "escolares"),
];

const LIXO_CATS: Array<[string, string]> = [
  ["Coletado por serviço de limpeza", "coletado"],
  ["Depositado em caçamba de serviço de limpeza", "cacamba"],
  ["Queimado na propriedade", "queimado"],
  ["Enterrado na propriedade", "enterrado"],
  ["Jogado em terreno baldio, encosta ou área pública", "terreno_baldio"],
  ["Outro destino", "outro"],
];
const ESGOTO_CATS: Array<[string, string]> = [
  ["Rede geral ou pluvial", "rede"],
  ["Fossa séptica ou fossa filtro", "fossa_septica"],
  ["Fossa rudimentar ou buraco", "fossa_rudimentar"],
  ["Vala", "vala"],
  ["Rio, lago, córrego ou mar", "rio"],
  ["Outra forma", "outra"],
  ["Sem banheiro nem sanitário", "sem_banheiro"],
];

const SANEAMENTO: Indicador[] = [
  {
    id: "domicilios",
    nome: "Domicílios",
    tema: "Saneamento",
    descricao: "Domicílios particulares recenseados, base dos percentuais de saneamento.",
    unidade: "domicílios",
    casas: 0,
    consulta: "esgoto",
    agregacao: "soma",
    linhas: uma("total"),
    formula: "contagem",
    fonte: CENSO,
    observacao: "Censos de 2000, 2010 e 2022.",
    painel: painel("saneamento"),
  },
  {
    id: "lixo_coletado",
    nome: "Domicílios com lixo coletado",
    tema: "Saneamento",
    descricao: "Percentual dos domicílios cujo lixo é coletado por serviço de limpeza, direto ou em caçamba.",
    unidade: "% dos domicílios",
    casas: 2,
    consulta: "lixo",
    agregacao: "razao",
    fator: 100,
    linhas: uma("coletado + cacamba", "total"),
    formula: "100 × (coletado + depositado em caçamba) ÷ domicílios",
    fonte: CENSO,
    observacao:
      "Censos de 2010 e 2022. Para só a coleta porta a porta, use destino_lixo com a categoria 'Coletado por serviço de limpeza'.",
    painel: painel("lixo"),
  },
  {
    id: "destino_lixo",
    nome: "Destino do lixo",
    tema: "Saneamento",
    descricao: "Percentual dos domicílios por destino do lixo (categoria).",
    unidade: "% dos domicílios",
    casas: 2,
    consulta: "lixo",
    agregacao: "razao",
    fator: 100,
    linhas: LIXO_CATS.map(([rotulo, coluna]) => cat(rotulo, coluna, "total")),
    formula: "100 × domicílios com aquele destino ÷ domicílios",
    fonte: CENSO,
    observacao: "Censos de 2010 e 2022. As seis categorias somam 100%.",
    painel: painel("lixo"),
  },
  {
    id: "esgotamento",
    nome: "Esgotamento sanitário",
    tema: "Saneamento",
    descricao: "Percentual dos domicílios por tipo de esgotamento sanitário (categoria).",
    unidade: "% dos domicílios",
    casas: 2,
    consulta: "esgoto",
    agregacao: "razao",
    fator: 100,
    linhas: ESGOTO_CATS.map(([rotulo, coluna]) => cat(rotulo, coluna, "total")),
    formula: "100 × domicílios com aquele tipo ÷ domicílios",
    fonte: CENSO,
    observacao:
      "Censos de 2000, 2010 e 2022. As sete categorias somam 100%. O banco não define 'esgoto adequado': diga as categorias que somou.",
    painel: painel("saneamento"),
  },
  {
    id: "esgoto_rede_geral",
    nome: "Domicílios ligados à rede geral de esgoto",
    tema: "Saneamento",
    descricao: "Percentual dos domicílios com esgoto ligado à rede geral ou pluvial.",
    unidade: "% dos domicílios",
    casas: 2,
    consulta: "esgoto",
    agregacao: "razao",
    fator: 100,
    linhas: uma("rede", "total"),
    formula: "100 × domicílios ligados à rede geral ou pluvial ÷ domicílios",
    fonte: CENSO,
    observacao: "Censos de 2000, 2010 e 2022.",
    painel: painel("saneamento"),
  },
];

const SECA_OBS =
  "Mensal, de janeiro de 2020 a agosto de 2026 (periodo 'AAAA-MM'). Classes: S0 seca fraca, S1 moderada, S2 grave, S3 extrema, S4 excepcional; 'Sem seca relativa' é a área fora de seca. Cada classe é a área daquela classe, não a soma das piores.";
const seca = (id: string, nome: string, descricao: string, coluna: string): Indicador => ({
  id,
  nome,
  tema: "Seca",
  descricao,
  unidade: "% da área",
  casas: 1,
  consulta: "seca_total",
  agregacao: "razao",
  fator: 100,
  linhas: uma(coluna, "area_mun"),
  formula: "100 × área nas classes ÷ área do território",
  fonte: "Monitor de Secas (ANA)",
  observacao: SECA_OBS,
});

const SECA: Indicador[] = [
  {
    id: "monitor_secas",
    nome: "Monitor de Secas: área por classe de seca",
    tema: "Seca",
    descricao: "Percentual da área do território em cada classe de seca no mês (categoria = classe).",
    unidade: "% da área",
    casas: 1,
    consulta: "seca",
    agregacao: "razao",
    fator: 100,
    linhas: uma("area_classe", "area_mun"),
    formula: "100 × área da classe ÷ área do território",
    fonte: "Monitor de Secas (ANA)",
    observacao: `${SECA_OBS} As categorias somam 100%; 'Sem informação' é a parte da área que o Monitor não classificou naquele mês (INC-11).`,
  },
  seca("area_em_seca", "Área em seca (S0 a S4)", "Percentual da área do território em qualquer classe de seca, da fraca à excepcional.", "area_s0"),
  seca("area_seca_moderada_ou_pior", "Área em seca moderada ou pior (S1 a S4)", "Percentual da área em seca moderada, grave, extrema ou excepcional.", "area_s1"),
  seca("area_seca_grave_ou_pior", "Área em seca grave ou pior (S2 a S4)", "Percentual da área em seca grave, extrema ou excepcional.", "area_s2"),
];

export const INDICADORES: Indicador[] = [
  ...DEMOGRAFIA,
  ...ECONOMIA,
  ...DESENVOLVIMENTO,
  ...EDUCACAO,
  ...SAUDE,
  ...ASSISTENCIA,
  ...AGUA,
  ...SANEAMENTO,
  ...SECA,
  ...INDICADORES_AMPLIACAO,
];

/** Ordem das categorias que não seguem a ordem alfabética. */
export const ORDEM_DAS_CATEGORIAS: Record<string, string[]> = {
  monitor_secas: [
    "Sem seca relativa",
    "S0 – Seca fraca",
    "S1 – Seca moderada",
    "S2 – Seca grave",
    "S3 – Seca extrema",
    "S4 – Seca excepcional",
    "Sem informação",
  ],
};

/** Consulta extra que descreve as categorias (público-alvo e meta de cada vacina). */
export const DESCRICOES_DAS_CATEGORIAS: Record<string, string> = {
  imunizacao: `SELECT vacina AS categoria,
    'Público-alvo: ' || MAX(categoria) || '.' ||
    COALESCE(' Previne: ' || NULLIF(MAX(doenca_prevenida), '') || '.', '') ||
    COALESCE(' Meta de cobertura: ' || MAX(meta_cobertura)::int || '%.', ' Sem meta definida.') ||
    ' Anos: ' || string_agg(DISTINCT ano::text, ', ' ORDER BY ano::text) || '.' AS descricao
    FROM sau_imunizacao.vw_imunizacao_anual GROUP BY vacina`,
};
