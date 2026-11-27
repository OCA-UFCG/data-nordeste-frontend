/**
 * Nomes antigos dos municípios da área da Sudene, para a busca de território
 * achar o município pelo nome que a pessoa ainda usa. Na rodada c17 (NA03),
 * "Santarém, na Paraíba" voltou como "não existe Santarém em nenhum estado":
 * o município se chama Joca Claudino desde 2011.
 *
 * Fonte: IBGE, Alterações Toponímicas Municipais 2025 (planilha em
 * geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/alteracoes_toponimicas_municipais/),
 * filtrada pelos códigos dos 2.074 municípios do tabelão em 25/11/2026.
 *
 * INTENTIONAL: só as trocas de 1985 em diante. As de 1938 a 1953 quase sempre
 * repetem o nome atual de outro município da área ("Boa Vista" → Santa Maria
 * da Boa Vista, mas Boa Vista é da PB; "Belmonte", "Itaparica", "São Bento",
 * "Serrinha"), e a busca passaria a pedir a UF em perguntas óbvias; as que
 * sobram ("Jaboatão", "Cabo", "Taquaritinga") a busca por parte do nome já
 * acha. Correções só de acento (Iuiú → Iuiu, Quixabá → Quixaba) também ficam
 * de fora: a busca ignora acento.
 *
 * Uma troca nova entra aqui com o código IBGE do município, o nome antigo e o
 * ano em que o IBGE registrou a troca; o nome atual vem do tabelão.
 */
export type NomeAntigo = { codigo: string; antigo: string; ano: number };

export const NOMES_ANTIGOS: readonly NomeAntigo[] = [
  { codigo: "2900504", antigo: "Água Quente", ano: 1985 },
  { codigo: "3125507", antigo: "Felisberto Caldeira", ano: 1986 },
  { codigo: "2403251", antigo: "Eduardo Gomes", ano: 1987 },
  { codigo: "2500700", antigo: "Antenor Navarro", ano: 1989 },
  { codigo: "3102704", antigo: "André Fernandes", ano: 1989 },
  { codigo: "2505501", antigo: "Desterro de Malta", ano: 1991 },
  { codigo: "2614303", antigo: "Sítio dos Moreiras", ano: 1991 },
  { codigo: "3171501", antigo: "Vila Matias", ano: 1991 },
  { codigo: "2502607", antigo: "Boqueirão dos Cochos", ano: 1992 },
  { codigo: "2207959", antigo: "Petrônio Portela", ano: 1997 },
  { codigo: "2512754", antigo: "Assis Chateaubriand", ano: 1997 },
  { codigo: "2513158", antigo: "Santa Cecília do Umbuzeiro", ano: 1997 },
  { codigo: "2513927", antigo: "São Bento de Pombal", ano: 1997 },
  { codigo: "2919504", antigo: "Livramento do Brumado", ano: 1998 },
  { codigo: "2412559", antigo: "São Miguel de Touros", ano: 2001 },
  { codigo: "3131802", antigo: "Itabirinha de Mantena", ano: 2001 },
  { codigo: "2903300", antigo: "Governador Lomanto Júnior", ano: 2003 },
  { codigo: "2513968", antigo: "São Domingos de Pombal", ano: 2006 },
  { codigo: "2601607", antigo: "Belém de São Francisco", ano: 2009 },
  { codigo: "2608503", antigo: "Lagoa do Itaenga", ano: 2009 },
  { codigo: "2516409", antigo: "Campo de Santana", ano: 2010 },
  { codigo: "2513653", antigo: "Santarém", ano: 2011 },
  { codigo: "2515401", antigo: "Seridó", ano: 2013 },
  { codigo: "2606903", antigo: "Iguaraci", ano: 2013 },
  // Presidente Juscelino (MA) continua com esse nome: a busca traz os dois.
  { codigo: "2410306", antigo: "Presidente Juscelino", ano: 2014 },
  { codigo: "2306306", antigo: "Itapagé", ano: 2015 },
  { codigo: "2922250", antigo: "Muquém de São Francisco", ano: 2016 },
  { codigo: "2401305", antigo: "Augusto Severo", ano: 2019 },
  { codigo: "2800100", antigo: "Amparo de São Francisco", ano: 2020 },
  { codigo: "2400208", antigo: "Açu", ano: 2025 },
  { codigo: "2401206", antigo: "Arês", ano: 2025 },
];
