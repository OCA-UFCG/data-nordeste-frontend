import { PanelInfo } from "@/components/Panel/layout/PanelInfo";
import type { IdhVisao } from "@/features/panels/idh/idhPanel";

type SaibaMaisItem = { paragraphs: string[]; list?: string[] };

// Textos do balão "Saiba mais" do Power BI, sem alterações. A página "Visão
// geral" tem uma versão revisada; as de sexo e cor, a mesma versão anterior.
const GERAL: SaibaMaisItem[] = [
  {
    paragraphs: [
      "IDH é um indicador criado pelo Programa das Nações Unidas para o Desenvolvimento (PNUD) para medir o nível de desenvolvimento humano de um país ou região. Ele varia de 0 a 1. Valores próximos de 1 indicam um maior desenvolvimento.",
      "O cálculo do IDH considera as seguintes dimensões:",
    ],
    list: [
      "Educação: anos esperados de estudo e média de anos de estudo da população adulta;",
      "Longevidade: transformação da esperança de vida ao nascer; e",
      "Renda: Renda Nacional Bruta (RNB) per capita ajustada ao poder de compra.",
    ],
  },
  {
    paragraphs: [
      "O IDH é classificado em cinco níveis, que ajudam a interpretar o desenvolvimento dos estados:",
    ],
    list: [
      "Muito baixo: 0 a 0,49;",
      "Baixo: 0,50 a 0,59;",
      "Médio: 0,60 a 0,69;",
      "Alto: 0,70 a 0,79; e",
      "Muito alto: 0,80 a 1.",
    ],
  },
  {
    paragraphs: [
      "IDH ajustado à desigualdade (IDHAD) é uma versão do IDH que considera as desigualdades internas de um país ou região nas três dimensões básicas do desenvolvimento humano (educação, longevidade e renda). Esse índice varia de 0 a 1 e é sempre igual ou inferior ao IDH tradicional. Assim, cada dimensão do IDH é ajustado de forma que quanto maior a desigualdade, maior é a redução do índice. Valores próximos a 1 indicam que há alto desenvolvimento com baixa desigualdade. O IDHAD representa, portanto, o nível efetivo de desenvolvimento humano, após descontar as perdas causadas pela desigualdade.",
    ],
  },
  {
    paragraphs: [
      "Índice de Gini é uma medida de desigualdade econômica, frequentemente usada para avaliar a distribuição de renda em uma população. Ele varia de 0 a 1, em que:",
    ],
    list: [
      "0 (zero) indica igualdade perfeita, ou seja, todos têm a mesma renda.",
      "1 (um) indica desigualdade máxima, ou seja, uma única pessoa detém toda a renda e as demais nada possuem.",
    ],
  },
  {
    paragraphs: [
      "Renda per capita é um indicador que apresenta quanto cada pessoa teria, em média, se a renda total de uma região fosse dividida igualmente entre todos os seus habitantes, independentemente de estarem trabalhando ou não.",
    ],
  },
  {
    paragraphs: [
      "Renda média dos ocupados é a média do rendimento do trabalho principal recebido pelas pessoas ocupadas. É calculada pela soma dos rendimentos do trabalho dessas pessoas dividida pelo número de ocupados com rendimento. Trata-se de um indicador útil para medir o nível de remuneração da população economicamente ativa.",
    ],
  },
];

const GRUPOS: SaibaMaisItem[] = [
  {
    paragraphs: [
      "IDH é um indicador criado pelo Programa das Nações Unidas para o Desenvolvimento (PNUD) para medir o nível de desenvolvimento humano de um país ou região. Ele varia de 0 a 1. Valores próximos de 1 indicam um maior desenvolvimento.",
      "O cálculo do IDH considera as dimensões:",
    ],
    list: [
      "Educação: anos esperados de estudo e média de anos de estudo da população adulta;",
      "Longevidade: esperança de vida ao nascer; e",
      "Renda: PIB per capita ajustado ao poder de compra.",
    ],
  },
  {
    paragraphs: [
      "O IDH é classificado em cinco níveis, que ajudam a interpretar o desenvolvimento dos municípios:",
    ],
    list: GERAL[1].list,
  },
  {
    paragraphs: [
      "IDH ajustado à desigualdade (IDH-D) é uma versão do IDH que considera as desigualdades internas de um país ou região nas três dimensões básicas do desenvolvimento humano (educação, longevidade e renda). Esse índice varia de 0 a 1. Valores próximos a 1 indicam que há alto desenvolvimento com baixa desigualdade.",
    ],
  },
  {
    paragraphs: [
      "Índice de Gini é uma medida de desigualdade econômica, frequentemente usada para avaliar a distribuição de renda em uma população. Ele varia de 0 a 1, onde:",
    ],
    list: GERAL[3].list,
  },
  GERAL[4],
  {
    paragraphs: [
      "Renda média dos ocupados é a média dos salários recebidos por todas as pessoas que trabalham (pessoas ocupadas). ganham as pessoas que estão trabalhando. É um indicador útil para medir o nível de remuneração da população economicamente ativa.",
    ],
  },
];

const SaibaMaisEntry = ({ item }: { item: SaibaMaisItem }) => (
  <li className="flex flex-col gap-1">
    {item.paragraphs.map((text) => (
      <p key={text}>{text}</p>
    ))}
    {item.list ? (
      <ul className="list-[circle] pl-5">
        {item.list.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    ) : null}
  </li>
);

export const IdhSaibaMais = ({ visao }: { visao: IdhVisao }) => (
  <PanelInfo label="Saiba mais">
    <p className="mb-2 font-semibold">Saiba mais</p>
    <ul className="flex max-h-[60vh] list-disc flex-col gap-2 overflow-y-auto pl-5">
      {(visao === "geral" ? GERAL : GRUPOS).map((item) => (
        <SaibaMaisEntry key={item.paragraphs[0]} item={item} />
      ))}
    </ul>
  </PanelInfo>
);
