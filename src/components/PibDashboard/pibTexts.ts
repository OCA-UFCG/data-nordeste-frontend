// Textos do painel do PIB do protótipo. Ficam fora dos componentes para a
// página (servidor) e o painel (cliente) lerem a mesma redação.

// Texto de abertura da capa.
export const PIB_LEAD =
  "Acompanhe a riqueza gerada pelos estados do Nordeste: o PIB total e per capita ao longo do tempo, a comparação entre estados e a contribuição de cada setor da economia.";

// Fonte que vai no rodapé dos cards e na imagem baixada.
export const PIB_CARD_SOURCE = "Fonte: IBGE · Data Nordeste";

// INTENTIONAL: sem "Atualizado em". O protótipo traz "11/2026" fixo e o banco
// não informa quando o PIB foi carregado; inclua a data quando houver fonte.
export const PIB_CARD_FOOTER = { source: PIB_CARD_SOURCE } as const;

// Textos do ⓘ de cada card, do protótipo.
export const PIB_CARD_INFO = {
  line: "PIB total (eixo da esquerda, em R$) e PIB per capita (eixo da direita, em R$ mil). Clique em um ponto para mudar o ano.",
  map: "Cada estado recebe a cor da faixa do seu PIB total. Clique em um estado para usá-lo como filtro do painel.",
  vab: "Valor adicionado bruto de cada grande setor da economia. Os dados setoriais vão até 2021.",
  atividade:
    "As três atividades com maior participação no PIB do território selecionado, em % do PIB. Os dados setoriais vão até 2021.",
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
