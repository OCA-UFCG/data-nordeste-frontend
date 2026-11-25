/**
 * Temas que entraram no tabelão na ampliação de 24/11/2026 (pedido da
 * equipe: "não dá pra pôr todos os temas?"). Mesmo formato de
 * indicadores.ts, em arquivo separado para aquele não passar de 800 linhas.
 *
 * O inventário das views que ainda faltam está em
 * docs/inventario-do-banco.md.
 */
import type { Consulta, Indicador, Linha } from "./indicadores.ts";

const CENSO = "Censo Demográfico (IBGE)";
const painel = (id: string) => `https://datanordeste.sudene.gov.br/data-panel/${id}`;

const cat = (categoria: string, numerador: string, denominador?: string): Linha => ({
  recorte: { categoria },
  numerador,
  ...(denominador ? { denominador } : {}),
});

/** "faixa_0_9" → "0 a 9 anos"; "faixa_80_mais" → "80 anos ou mais". */
const FAIXA_INDIGENA = `CASE WHEN faixa_etaria LIKE '%mais' THEN regexp_replace(faixa_etaria, '^faixa_(\\d+)_mais$', '\\1 anos ou mais')
  ELSE regexp_replace(faixa_etaria, '^faixa_(\\d+)_(\\d+)$', '\\1 a \\2 anos') END`;

/** Soma das quatro colunas de nível de instrução (pessoas de 25 anos ou mais). */
const PESSOAS_25 = "(sem_instrucao + fundamental + medio + superior)";

export const CONSULTAS_AMPLIACAO: Consulta[] = [
  {
    id: "estabelecimentos",
    origem: "sau_estabelecimento_de_saude.estabelecimento_saude_geral",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      tipo_estab AS categoria, total
      FROM sau_estabelecimento_de_saude.estabelecimento_saude_geral`,
    dimensoes: ["categoria"],
    medidas: ["total"],
  },
  {
    id: "desmatamento",
    origem: "meio_desmatamento.vw_desmat_geral_municipios",
    // INC-19: os primeiros anos do PRODES Caatinga e Mata Atlântica são
    // períodos de 2 a 4 anos, gravados repetidos em cada ano do período.
    // 2025 só tem Cerrado e Amazônia de 517 municípios: fica de fora.
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      desmat_caat_km2 AS caatinga, desmat_cerrado_km2 AS cerrado,
      desmat_mata_atl_km2 AS mata_atlantica, desmat_amazonia_km2 AS amazonia
      FROM meio_desmatamento.vw_desmat_geral_municipios WHERE ano <= 2024`,
    dimensoes: [],
    medidas: ["caatinga", "cerrado", "mata_atlantica", "amazonia"],
  },
  {
    id: "indigenas",
    origem: "dem_demografia_indigena.vw_populacao_indigena_geral",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      ${FAIXA_INDIGENA} AS faixa_etaria,
      pop_total_indigena AS total, homem_indigena AS homens, mulher_indigena AS mulheres,
      dentro_territorio_indigena AS dentro, fora_territorio_indigena AS fora
      FROM dem_demografia_indigena.vw_populacao_indigena_geral`,
    dimensoes: ["faixa_etaria"],
    medidas: ["total", "homens", "mulheres", "dentro", "fora"],
  },
  {
    id: "quilombolas",
    origem: "dem_demografia_quilombola.vw_demografia_quilombola_faixas_agrupadas",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      populacao_total_quilombola AS total, populacao_total_geral AS populacao,
      total_homens_quilombolas AS homens, total_mulheres_quilombolas AS mulheres,
      em_territorio_quilombola AS dentro, fora_territorio_quilombola AS fora
      FROM dem_demografia_quilombola.vw_demografia_quilombola_faixas_agrupadas`,
    dimensoes: [],
    medidas: ["total", "populacao", "homens", "mulheres", "dentro", "fora"],
  },
  {
    id: "instrucao",
    origem: "edu_nivel_de_instrucao.niveis_instrucao_geral",
    // INC-20: em 2000 sexo e cor ou raça vêm em linhas separadas (uma com
    // sexo e cor vazia, outra o contrário); somar as duas dobraria o total.
    // Só 2010 e 2022, que cruzam sexo × cor × faixa.
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      sexo, cor_ou_raca AS cor_raca, faixa_etaria,
      sem_instrucao_fund_incomp AS sem_instrucao, fund_comp_medio_incomp AS fundamental,
      medio_comp_superior_incomp AS medio, superior_completo AS superior
      FROM edu_nivel_de_instrucao.niveis_instrucao_geral WHERE ano IN (2010, 2022)`,
    dimensoes: ["sexo", "cor_raca", "faixa_etaria"],
    medidas: ["sem_instrucao", "fundamental", "medio", "superior"],
  },
  {
    id: "area_formacao",
    origem: "edu_nivel_de_instrucao.vw_area_formacao_geral",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      area_formacao AS categoria, total
      FROM edu_nivel_de_instrucao.vw_area_formacao_geral`,
    dimensoes: ["categoria"],
    medidas: ["total"],
  },
  {
    id: "alfabetizacao_indigena",
    origem: "edu_alfabetizacao_indigena.vw_alfabetizacao_indigena",
    // A view traz a linha idade = 'Total' junto das faixas: fica de fora, e o
    // total sai da soma das faixas (confere com a linha 'Total').
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      idade AS faixa_etaria,
      total_populacao_indigena_15_mais AS pessoas, total_indigenas_nao_alfabetizados_15_mais AS nao_alf,
      total_homens_indigenas_15_mais AS homens, homens_indigenas_nao_alfabetizados_15_mais AS homens_nao_alf,
      total_mulheres_indigenas_15_mais AS mulheres, mulheres_indigenas_nao_alfabetizadas_15_mais AS mulheres_nao_alf
      FROM edu_alfabetizacao_indigena.vw_alfabetizacao_indigena WHERE idade <> 'Total'`,
    dimensoes: ["faixa_etaria"],
    medidas: ["pessoas", "nao_alf", "homens", "homens_nao_alf", "mulheres", "mulheres_nao_alf"],
  },
  {
    id: "alfabetizacao_quilombola",
    origem: "edu_alfabetizacao_quilombola.vw_alfabetizacao_quilombola",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      idade AS faixa_etaria,
      total_populacao_quilombola_15_mais AS pessoas, total_quilombolas_nao_alfabetizados_15_mais AS nao_alf,
      total_homens_quilombolas_15_mais AS homens, homens_quilombolas_nao_alfabetizados_15_mais AS homens_nao_alf,
      total_mulheres_quilombolas_15_mais AS mulheres, mulheres_quilombolas_nao_alfabetizadas_15_mais AS mulheres_nao_alf
      FROM edu_alfabetizacao_quilombola.vw_alfabetizacao_quilombola WHERE idade <> 'Total'`,
    dimensoes: ["faixa_etaria"],
    medidas: ["pessoas", "nao_alf", "homens", "homens_nao_alf", "mulheres", "mulheres_nao_alf"],
  },
  {
    id: "aridez",
    origem: "meio_aridez.vw_aridez",
    // Mesmas regras do painel nativo /demo/aridez (frontend, aridezClasses.ts):
    // dn_uni 2 árido, 3 semiárido, 4 subúmido seco, 5 úmido; o resto (1 e
    // vazio) fica de fora, e o percentual é sobre a área classificada.
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano_consolidacao::int AS ano, NULL::int AS mes,
      SUM(area_km2_classe) FILTER (WHERE dn_uni = '2') AS arido,
      SUM(area_km2_classe) FILTER (WHERE dn_uni = '3') AS semiarido,
      SUM(area_km2_classe) FILTER (WHERE dn_uni = '4') AS subumido,
      SUM(area_km2_classe) FILTER (WHERE dn_uni = '5') AS umido,
      SUM(area_km2_classe) FILTER (WHERE dn_uni IN ('2', '3', '4')) AS asd,
      SUM(area_km2_classe) FILTER (WHERE dn_uni IN ('2', '3', '4', '5')) AS classificada
      FROM meio_aridez.vw_aridez GROUP BY 1, 2, 3`,
    dimensoes: [],
    medidas: ["arido", "semiarido", "subumido", "umido", "asd", "classificada"],
  },
  {
    id: "escassez",
    origem: "hidr_escassez.vw_ameaca_publicavel",
    sql: `SELECT cd_mun::int AS cd_mun, nm_mun, ano::int AS ano, NULL::int AS mes,
      cenario AS categoria, indice
      FROM hidr_escassez.vw_ameaca_publicavel`,
    dimensoes: ["categoria"],
    medidas: ["indice"],
  },
];

const NIVEIS: Array<[string, string]> = [
  ["Sem instrução ou fundamental incompleto", "sem_instrucao"],
  ["Fundamental completo e médio incompleto", "fundamental"],
  ["Médio completo e superior incompleto", "medio"],
  ["Superior completo", "superior"],
];

const OBS_INSTRUCAO =
  "Pessoas de 25 anos ou mais, Censos de 2010 e 2022 (o de 2000 existe no portal, mas sem cruzar sexo e cor ou raça; não está aqui). Sexo, cor ou raça e faixa etária se cruzam. Faixas: 25 a 29, 30 a 39, 40 a 49, 50 a 59 anos e 60 anos ou mais. Categoria = nível mais alto concluído; 'total' soma os quatro níveis.";

const OBS_DESMATAMENTO =
  "Área desmatada no ano, em km², por bioma (categoria), de 2001 a 2024; 'total' soma os biomas presentes no município. ATENÇÃO: nos primeiros anos da Caatinga e da Mata Atlântica o PRODES mediu períodos de 2 a 4 anos, e o banco repete o valor do período em cada ano (ex.: Caatinga 2001 a 2004 = 12.186 km² em cada ano). Anos seguidos com o mesmo valor são um período só: não some esses anos nem diga que o desmatamento ficou igual. Amazônia só a partir de 2008. Um município pode ter mais de um bioma.";

const OBS_ARIDEZ =
  "Anos 1991, 2001, 2011 e 2021: cada um resume o clima de um período longo, não o ano em si (diga 'referência 2021'). O índice é chuva ÷ evapotranspiração potencial; quanto menor, mais seco. Classes do painel de aridez: árido, semiárido, subúmido seco e úmido. Não confunda 'semiárido' (classe de clima) com o recorte Semiárido (delimitação oficial da Sudene). 2.073 municípios (um sem dado).";

export const INDICADORES_AMPLIACAO: Indicador[] = [
  {
    id: "estabelecimentos_saude",
    nome: "Estabelecimentos de saúde",
    tema: "Saúde",
    descricao:
      "Número de estabelecimentos de saúde cadastrados no CNES, por tipo (categoria): UBS, hospitais, clínicas, consultórios, farmácias, CAPS etc.",
    unidade: "estabelecimentos",
    casas: 0,
    consulta: "estabelecimentos",
    agregacao: "soma",
    linhas: [{ numerador: "total" }],
    totais: ["categoria"],
    formula: "contagem de estabelecimentos no cadastro",
    fonte: "Cadastro Nacional de Estabelecimentos de Saúde (CNES/DATASUS)",
    observacao:
      "Anos 2010 e 2020 a 2025. Inclui públicos e privados (consultório isolado e clínica são a maioria). Não diz número de leitos nem de profissionais. 'Hospital Geral' e 'Hospital Especializado' são categorias separadas: para 'hospitais', some as duas e diga isso.",
    painel: painel("estabelecimentos"),
  },
  {
    id: "desmatamento",
    nome: "Área desmatada no ano",
    tema: "Meio ambiente",
    descricao: "Área de vegetação nativa desmatada no ano, em km², por bioma (Caatinga, Cerrado, Mata Atlântica, Amazônia).",
    unidade: "km²",
    casas: 1,
    consulta: "desmatamento",
    agregacao: "soma",
    linhas: [
      cat("Caatinga", "caatinga"),
      cat("Cerrado", "cerrado"),
      cat("Mata Atlântica", "mata_atlantica"),
      cat("Amazônia", "amazonia"),
    ],
    totais: ["categoria"],
    formula: "soma da área desmatada dos municípios",
    fonte: "PRODES (INPE)",
    observacao: OBS_DESMATAMENTO,
  },
  {
    id: "populacao_indigena",
    nome: "População indígena",
    tema: "Demografia",
    descricao:
      "Pessoas indígenas segundo o Censo (quem se declarou indígena na cor ou raça e, em 2022, também quem se considera indígena), por sexo e faixa etária; categoria separa quem mora em terra indígena e fora dela.",
    unidade: "pessoas",
    casas: 0,
    consulta: "indigenas",
    agregacao: "soma",
    linhas: [
      { numerador: "total" },
      { recorte: { sexo: "Homens" }, numerador: "homens" },
      { recorte: { sexo: "Mulheres" }, numerador: "mulheres" },
      cat("Em terra indígena", "dentro"),
      cat("Fora de terra indígena", "fora"),
    ],
    totais: ["faixa_etaria"],
    formula: "contagem de pessoas",
    fonte: CENSO,
    observacao:
      "Censos de 2010 e 2022. Sexo e categoria (dentro ou fora de terra indígena) não se cruzam: filtre um e deixe o outro em 'total'. Dentro + fora fica um pouco abaixo do total (pessoas sem a informação). Este número é maior que o da cor ou raça 'Indígena' do indicador populacao, porque o Censo 2022 também conta quem se considera indígena. Faixas de 10 anos: 0 a 9 até 80 anos ou mais.",
  },
  {
    id: "populacao_quilombola",
    nome: "População quilombola",
    tema: "Demografia",
    descricao:
      "Pessoas quilombolas no Censo 2022 (primeiro Censo a contá-las), por sexo; categoria separa quem mora em território quilombola e fora dele.",
    unidade: "pessoas",
    casas: 0,
    consulta: "quilombolas",
    agregacao: "soma",
    linhas: [
      { numerador: "total" },
      { recorte: { sexo: "Homens" }, numerador: "homens" },
      { recorte: { sexo: "Mulheres" }, numerador: "mulheres" },
      cat("Em território quilombola", "dentro"),
      cat("Fora de território quilombola", "fora"),
    ],
    formula: "contagem de pessoas",
    fonte: CENSO,
    observacao: "Só 2022. Sexo e categoria não se cruzam: filtre um e deixe o outro em 'total'.",
    painel: painel("demografia_quilombola"),
  },
  {
    id: "percentual_quilombola",
    nome: "Percentual da população que é quilombola",
    tema: "Demografia",
    descricao: "Pessoas quilombolas em relação à população residente, no Censo 2022.",
    unidade: "% da população",
    casas: 2,
    consulta: "quilombolas",
    agregacao: "razao",
    fator: 100,
    linhas: [{ numerador: "total", denominador: "populacao" }],
    formula: "100 × quilombolas ÷ população residente",
    fonte: CENSO,
    observacao: "Só 2022.",
    painel: painel("demografia_quilombola"),
  },
  {
    id: "pessoas_por_nivel_instrucao",
    nome: "Pessoas de 25 anos ou mais por nível de instrução",
    tema: "Educação",
    descricao: "Número de pessoas de 25 anos ou mais pelo nível de instrução mais alto concluído (categoria).",
    unidade: "pessoas",
    casas: 0,
    consulta: "instrucao",
    agregacao: "soma",
    linhas: NIVEIS.map(([nome, col]) => cat(nome, col)),
    totais: ["categoria", "sexo", "cor_raca", "faixa_etaria"],
    formula: "contagem de pessoas",
    fonte: CENSO,
    observacao: OBS_INSTRUCAO,
    painel: painel("niveldeinstrucao"),
  },
  {
    id: "percentual_nivel_instrucao",
    nome: "Percentual das pessoas de 25 anos ou mais por nível de instrução",
    tema: "Educação",
    descricao:
      "Percentual das pessoas de 25 anos ou mais em cada nível de instrução (categoria). 'Superior completo' é a pergunta mais comum.",
    unidade: "% das pessoas de 25 anos ou mais",
    casas: 2,
    consulta: "instrucao",
    agregacao: "razao",
    fator: 100,
    linhas: NIVEIS.map(([nome, col]) => cat(nome, col, PESSOAS_25)),
    totais: ["sexo", "cor_raca", "faixa_etaria"],
    formula: "100 × pessoas no nível ÷ pessoas de 25 anos ou mais",
    fonte: CENSO,
    observacao: `${OBS_INSTRUCAO} As quatro categorias somam 100%.`,
    painel: painel("niveldeinstrucao"),
  },
  {
    id: "taxa_analfabetismo_indigena",
    nome: "Taxa de analfabetismo da população indígena",
    tema: "Educação",
    descricao: "Percentual das pessoas indígenas de 15 anos ou mais que não sabem ler e escrever, por sexo e faixa etária.",
    unidade: "% das pessoas indígenas de 15 anos ou mais",
    casas: 2,
    consulta: "alfabetizacao_indigena",
    agregacao: "razao",
    fator: 100,
    linhas: [
      { numerador: "nao_alf", denominador: "pessoas" },
      { recorte: { sexo: "Homens" }, numerador: "homens_nao_alf", denominador: "homens" },
      { recorte: { sexo: "Mulheres" }, numerador: "mulheres_nao_alf", denominador: "mulheres" },
    ],
    totais: ["faixa_etaria"],
    formula: "100 × indígenas não alfabetizados de 15+ ÷ indígenas de 15+",
    fonte: CENSO,
    observacao: "Censos de 2010 e 2022. Faixas: 15 a 19, 20 a 24, 25 a 34, 35 a 44, 45 a 54, 55 a 64 e 65 anos ou mais. Sexo e faixa se cruzam. Para comparar com a população geral, use taxa_analfabetismo do mesmo lugar e ano.",
    painel: painel("alfabetizacao_indigena"),
  },
  {
    id: "taxa_analfabetismo_quilombola",
    nome: "Taxa de analfabetismo da população quilombola",
    tema: "Educação",
    descricao: "Percentual das pessoas quilombolas de 15 anos ou mais que não sabem ler e escrever, por sexo e faixa etária.",
    unidade: "% das pessoas quilombolas de 15 anos ou mais",
    casas: 2,
    consulta: "alfabetizacao_quilombola",
    agregacao: "razao",
    fator: 100,
    linhas: [
      { numerador: "nao_alf", denominador: "pessoas" },
      { recorte: { sexo: "Homens" }, numerador: "homens_nao_alf", denominador: "homens" },
      { recorte: { sexo: "Mulheres" }, numerador: "mulheres_nao_alf", denominador: "mulheres" },
    ],
    totais: ["faixa_etaria"],
    formula: "100 × quilombolas não alfabetizados de 15+ ÷ quilombolas de 15+",
    fonte: CENSO,
    observacao: "Só 2022 (primeiro Censo a contar quilombolas). Faixas: 15 a 19, 20 a 24, 25 a 34, 35 a 44, 45 a 54, 55 a 64 e 65 anos ou mais. Para comparar com a população geral, use taxa_analfabetismo do mesmo lugar e ano.",
    painel: painel("alfabetizacao_quilombola"),
  },
  {
    id: "pessoas_por_area_formacao",
    nome: "Pessoas com curso superior por área de formação",
    tema: "Educação",
    descricao: "Pessoas com superior completo pela área do curso (categoria): educação, saúde, engenharia, negócios e direito etc.",
    unidade: "pessoas",
    casas: 0,
    consulta: "area_formacao",
    agregacao: "soma",
    linhas: [{ numerador: "total" }],
    totais: ["categoria"],
    formula: "contagem de pessoas",
    fonte: CENSO,
    observacao:
      "Censos de 2000, 2010 e 2022. ATENÇÃO: o IBGE mudou a classificação das áreas a cada Censo (ex.: 'Ciências sociais, negócios e direito' em 2010 virou 'Negócios, administração e direito' e 'Ciências sociais, comunicação e informação' em 2022; Computação/TIC só existe em 2022). Só compare anos em áreas com o mesmo nome (Educação, Engenharia, produção e construção, Serviços) e diga isso. O total inclui pessoas de qualquer idade com superior, então não bate com o nível de instrução (25 anos ou mais).",
    painel: painel("niveldeinstrucao"),
  },
  {
    id: "area_aridez",
    nome: "Área por classe de aridez",
    tema: "Meio ambiente",
    descricao: "Área do território, em km², em cada classe do índice de aridez (categoria): árido, semiárido, subúmido seco e úmido.",
    unidade: "km²",
    casas: 0,
    consulta: "aridez",
    agregacao: "soma",
    linhas: [
      { recorte: { categoria: "Árido" }, numerador: "arido" },
      { recorte: { categoria: "Semiárido" }, numerador: "semiarido" },
      { recorte: { categoria: "Subúmido seco" }, numerador: "subumido" },
      { recorte: { categoria: "Úmido" }, numerador: "umido" },
      { recorte: { categoria: "Área suscetível à desertificação (ASD)" }, numerador: "asd" },
      { numerador: "classificada" },
    ],
    formula: "soma da área de cada classe nos municípios",
    fonte: "Índice de aridez (dados climáticos processados para o Data Nordeste)",
    observacao: OBS_ARIDEZ,
    painel: painel("aridez"),
  },
  {
    id: "percentual_aridez",
    nome: "Percentual da área por classe de aridez",
    tema: "Meio ambiente",
    descricao: "Percentual da área classificada do território em cada classe do índice de aridez, e na área suscetível à desertificação (ASD = árido + semiárido + subúmido seco).",
    unidade: "% da área",
    casas: 1,
    consulta: "aridez",
    agregacao: "razao",
    fator: 100,
    linhas: [
      { recorte: { categoria: "Árido" }, numerador: "COALESCE(arido, 0)", denominador: "classificada" },
      { recorte: { categoria: "Semiárido" }, numerador: "COALESCE(semiarido, 0)", denominador: "classificada" },
      { recorte: { categoria: "Subúmido seco" }, numerador: "COALESCE(subumido, 0)", denominador: "classificada" },
      { recorte: { categoria: "Úmido" }, numerador: "COALESCE(umido, 0)", denominador: "classificada" },
      { recorte: { categoria: "Área suscetível à desertificação (ASD)" }, numerador: "COALESCE(asd, 0)", denominador: "classificada" },
    ],
    formula: "100 × área da classe ÷ área classificada",
    fonte: "Índice de aridez (dados climáticos processados para o Data Nordeste)",
    observacao: `${OBS_ARIDEZ} As quatro classes somam 100%; a ASD é a soma das três mais secas.`,
    painel: painel("aridez"),
  },
  {
    id: "indice_ameaca_escassez_hidrica",
    nome: "Índice de ameaça de escassez hídrica",
    tema: "Água",
    descricao: "Índice de 0 a 1 da ameaça de escassez de água no município, hoje (cenário atual, 2020) e projetado para 2030 e 2050 em dois cenários (otimista e pessimista).",
    unidade: "índice (0 a 1)",
    casas: 2,
    consulta: "escassez",
    agregacao: "municipal",
    linhas: [{ numerador: "indice" }],
    formula: "valor do estudo, por município",
    fonte: "Estudo de ameaça de escassez hídrica do Data Nordeste (fonte original a confirmar)",
    observacao:
      "Só por município (sem valor de estado). Categoria = cenário: 'atual' só em 2020; 'otimista' e 'pessimista' só em 2030 e 2050. 2030 e 2050 são PROJEÇÕES do estudo, não dados medidos: diga isso. Classes: muito baixo (0 a 0,19), baixo (0,2 a 0,39), médio (0,4 a 0,59), alto (0,6 a 0,79), muito alto (0,8 a 1). Para estados, conte municípios por classe na consulta e diga que é contagem de municípios.",
  },
];
