// INTENTIONAL: textos da revisão do painel de IDH (25/11/2026), copiados como
// vieram. Os nomes de "Renda per capita" e "Renda média dos ocupados" são os
// da revisão, não os rótulos dos cards.

// O balão e a folha do ⓘ espaçam parágrafos (`p + p`); a lista segue o ritmo.
const LIST_CLASS = "mt-1.5 list-disc space-y-0.5 pl-4";

const IDH_INFO = (
  <>
    <p>
      IDH é um indicador criado pelo Programa das Nações Unidas para o
      Desenvolvimento (PNUD) para medir o nível de desenvolvimento humano de um
      país ou região. Ele varia de 0 a 1. Valores próximos de 1 indicam um maior
      desenvolvimento.
    </p>
    <p>O cálculo do IDH considera as seguintes dimensões:</p>
    <ul className={LIST_CLASS}>
      <li>
        Educação: anos esperados de estudo e média de anos de estudo da
        população adulta;
      </li>
      <li>Longevidade: transformação da esperança de vida ao nascer; e</li>
      <li>
        Renda: Renda Nacional Bruta (RNB) per capita ajustada ao poder de
        compra.
      </li>
    </ul>
    <p>
      O IDH é classificado em cinco níveis, que ajudam a interpretar o
      desenvolvimento dos estados:
    </p>
    <ul className={LIST_CLASS}>
      <li>Muito baixo: 0 a 0,49;</li>
      <li>Baixo: 0,50 a 0,59;</li>
      <li>Médio: 0,60 a 0,69;</li>
      <li>Alto: 0,70 a 0,79; e</li>
      <li>Muito alto: 0,80 a 1.</li>
    </ul>
  </>
);

const IDHAD_INFO = (
  <p>
    IDH ajustado à desigualdade (IDHAD) é uma versão do IDH que considera as
    desigualdades internas de um país ou região nas três dimensões básicas do
    desenvolvimento humano (educação, longevidade e renda). Esse índice varia de
    0 a 1 e é sempre igual ou inferior ao IDH tradicional. Assim, cada dimensão
    do IDH é ajustado de forma que quanto maior a desigualdade, maior é a
    redução do índice. Valores próximos a 1 indicam que há alto desenvolvimento
    com baixa desigualdade. O IDHAD representa, portanto, o nível efetivo de
    desenvolvimento humano, após descontar as perdas causadas pela desigualdade.
  </p>
);

const GINI_INFO = (
  <>
    <p>
      Índice de Gini é uma medida de desigualdade econômica, frequentemente
      usada para avaliar a distribuição de renda em uma população. Ele varia de
      0 a 1, em que:
    </p>
    <ul className={LIST_CLASS}>
      <li>
        0 (zero) indica igualdade perfeita, ou seja, todos têm a mesma renda.
      </li>
      <li>
        1 (um) indica desigualdade máxima, ou seja, uma única pessoa detém toda
        a renda e as demais nada possuem.
      </li>
    </ul>
  </>
);

const RENDA_INFO = (
  <p>
    Renda per capita é um indicador que apresenta quanto cada pessoa teria, em
    média, se a renda total de uma região fosse dividida igualmente entre todos
    os seus habitantes, independentemente de estarem trabalhando ou não.
  </p>
);

const RENDIMENTO_INFO = (
  <p>
    Renda média dos ocupados é a média do rendimento do trabalho principal
    recebido pelas pessoas ocupadas. É calculada pela soma dos rendimentos do
    trabalho dessas pessoas dividida pelo número de ocupados com rendimento.
    Trata-se de um indicador útil para medir o nível de remuneração da população
    economicamente ativa.
  </p>
);

/**
 * ⓘ do card da série anual: o que são o IDH e o IDHAD, as duas linhas do
 * gráfico, e como escolher o ano (revisão do painel, 25/11/2026).
 *
 * @example <ProtoCardInfo title={EVOLUTION_TITLE} text={IDH_SERIE_INFO} />
 */
export const IDH_SERIE_INFO = (
  <>
    {IDH_INFO}
    {IDHAD_INFO}
    <p>Clique em um ponto para escolher um ano.</p>
  </>
);

/**
 * Texto do ⓘ de cada indicador do topo da visão geral do IDH.
 *
 * @example <ProtoCardInfo title="IDH" text={IDH_INDICATOR_INFO.idh} />
 */
export const IDH_INDICATOR_INFO = {
  idh: IDH_INFO,
  idhad: IDHAD_INFO,
  gini: GINI_INFO,
  renda: RENDA_INFO,
  rend: RENDIMENTO_INFO,
} as const;
