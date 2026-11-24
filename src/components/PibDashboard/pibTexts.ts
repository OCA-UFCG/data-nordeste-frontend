// Textos do painel do PIB do protótipo. Ficam fora dos componentes para a
// página (servidor) e o painel (cliente) lerem a mesma redação.

// Fallback da capa: cópia do `abovePanelDescription` do Contentful.
export const PIB_LEAD =
  "Os dados reunidos neste painel permitem explorar diferentes indicadores da atividade econômica dos estados e municípios que compõem as áreas de abrangência do Data Nordeste. As informações incluem o Produto Interno Bruto (PIB) total e per capita desses territórios, o total de impostos, o Valor Adicionado Bruto (VAB) por setor e as atividades econômicas que mais têm participação no PIB. Tais conteúdos podem subsidiar decisões relacionadas ao planejamento econômico, à definição de prioridades de investimento, ao fortalecimento de setores estratégicos e à redução das desigualdades entre os territórios.";

// Fonte da imagem baixada; na página, ela fica só na seção "Fonte dos dados".
export const PIB_CARD_SOURCE = "Fonte: IBGE · Data Nordeste";

// Título do card da linha, também no rótulo do SVG e na imagem baixada.
export const PIB_LINE_TITLE =
  "Dinâmica temporal do PIB total e do PIB per capita";

// Título do card do mapa, também no subtítulo da tela cheia e no rótulo.
export const PIB_MAP_TITLE = "PIB total por município";

// Trecho do ⓘ do VAB que o card destaca em negrito.
export const PIB_VAB_TERM = "Valor Adicionado Bruto (VAB)";

// ⓘ da equipe de conteúdo: um item por parágrafo, com o termo definido (em
// negrito no card) separado do resto.
export type PibInfoParagraph = { term?: string; rest: string };

export const PIB_MAP_INFO: readonly PibInfoParagraph[] = [
  {
    term: "Produto Interno Bruto (PIB)",
    rest: " é a soma de todos os bens e serviços finais produzidos em um país, estado ou município durante um determinado período.",
  },
  {
    term: "PIB per capita",
    rest: " indica a produção econômica média por habitante. É obtido dividindo-se o PIB total pela população do município. Em 2023, foi usada a população do Censo Demográfico de 2022, segundo nota do Instituto Brasileiro de Geografia e Estatística (IBGE).",
  },
  {
    rest: "Obs.: Os valores do PIB são apresentados a preços correntes de cada ano. A evolução nominal incorpora tanto variações na produção quanto nos preços.",
  },
];

export const PIB_ATIVIDADE_INFO: readonly PibInfoParagraph[] = [
  {
    term: "Participação da atividade com maior Valor Adicionado Bruto (VAB) no Produto Interno Bruto (PIB)",
    rest: " representa o percentual do PIB que é gerado pela atividade econômica de maior VAB no local selecionado. Esse indicador mostra o quanto a principal atividade econômica contribui para a geração de riqueza local.",
  },
  {
    rest: "Obs.: Enquanto nenhum município estiver selecionado, o gráfico apresenta um ranking das atividades com maior VAB. Ao selecionar um município, o gráfico passa a mostrar a participação da atividade de maior VAB no PIB do município selecionado.",
  },
];

// Unidade do subtítulo do card de atividade.
export const PIB_ATIVIDADE_UNIT = "Percentual do PIB (%)";

// Textos do ⓘ de cada card, do protótipo.
export const PIB_CARD_INFO = {
  line: "PIB total no eixo da esquerda e PIB per capita no eixo da direita, cada um na unidade escrita acima do eixo. Clique em um ponto para mudar o ano.",
  vab: `${PIB_VAB_TERM} por setor representa o quanto cada setor da economia contribui para a geração de riqueza, ou seja, para o Produto Interno Bruto (PIB).`,
} as const;

export const PIB_SAIBA_MAIS_TITLE = "Saiba mais sobre o PIB";

export const PIB_SAIBA_MAIS_SUMMARY =
  "O Produto Interno Bruto (PIB) é um indicador que representa a riqueza gerada em um território a partir da produção de bens e serviços em determinado período. Sua análise permite acompanhar a evolução econômica dos estados e municípios, identificar diferenças regionais e compreender como as atividades produtivas contribuem para o desenvolvimento local.";

export const PIB_SAIBA_MAIS_PARAGRAPHS: readonly string[] = [
  "Além do valor total produzido, o painel apresenta o PIB per capita, que relaciona a riqueza gerada ao número de habitantes, e o Valor Adicionado Bruto (VAB), indicador que mostra a contribuição dos diferentes setores econômicos para a formação do PIB.",
  "Outro aspecto importante é a participação da atividade com maior VAB no PIB, que evidencia o grau de concentração econômica do território. Quanto maior essa participação, maior tende a ser a dependência da economia em relação a um setor específico.",
  "Os dados apresentados no painel têm como fonte o IBGE, responsável pelo cálculo do PIB e de seus componentes para estados e municípios.",
];

// Definições do balão "Saiba mais" do Power BI: o protótipo não as traz, e
// elas explicam como ler cada indicador (per capita de 2023, preços correntes).
export const PIB_SAIBA_MAIS_GLOSSARY = [
  [
    "PIB",
    "Soma de todos os bens e serviços finais produzidos em um país, estado ou município durante um determinado período. Os valores são apresentados a preços correntes de cada ano: a evolução incorpora tanto variações na produção quanto nos preços.",
  ],
  [
    "PIB per capita",
    "Produção econômica média por habitante: o PIB total dividido pela população. Em 2023, foi usada a população do Censo 2022, segundo nota do IBGE.",
  ],
  [
    "VAB por setor",
    "Quanto cada setor da economia contribui para a geração de riqueza, ou seja, para o PIB.",
  ],
  [
    "Participação da atividade com maior VAB no PIB",
    "Percentual do PIB gerado pela atividade econômica de maior VAB no local selecionado.",
  ],
] as const;
