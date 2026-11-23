import {
  asdArea,
  asdShare,
  classifiedArea,
  rankAridezClasses,
  type AridezAreas,
} from "@/features/panels/aridez/aridezClasses";
import {
  formatAreaKm2,
  formatAreaKm2Full,
  formatSharePercent,
} from "@/features/panels/aridez/aridezFormat";
import { ARIDEZ_BASE_YEAR } from "@/features/panels/aridez/aridezPanel";
import type {
  PanelAnalysis,
  PanelAnalysisBlock,
} from "@/features/panels/panelAnalysis";

// O que o texto precisa saber: as áreas no ano escolhido e no de comparação,
// o nome curto do recorte (no meio da frase) e o completo (no rodapé).
type AridezAnaliseInput = {
  ano: number;
  areas: AridezAreas;
  baseAreas: AridezAreas | null;
  place: string;
  placeFull: string;
};

const ASD_TITLE = "Área Suscetível à Desertificação (ASD):";

const describeChange = (asd: number, baseAsd: number): string => {
  const change = asd - baseAsd;
  const percent =
    baseAsd > 0
      ? `, equivalente a ${formatSharePercent((change / baseAsd) * 100)}`
      : "";

  return `Isso representa uma variação de ${formatAreaKm2Full(change)}${percent}.`;
};

// Sem o ano de comparação (ou com ele escolhido), não há variação a contar.
const asdBlock = ({
  ano,
  areas,
  baseAreas,
  place,
}: AridezAnaliseInput): PanelAnalysisBlock => {
  const asd = asdArea(areas);

  if (asd <= 0) {
    return {
      title: ASD_TITLE,
      text: `O recorte selecionado (${place}) não tem área classificada como suscetível à desertificação (árido, semiárido ou subúmido seco) em ${ano}.`,
    };
  }
  if (!baseAreas || ano === ARIDEZ_BASE_YEAR) {
    return {
      title: ASD_TITLE,
      text: `Em ${ano}, a área selecionada tinha ${formatAreaKm2Full(asd)} em ASD.`,
    };
  }
  const baseAsd = asdArea(baseAreas);

  return {
    title: "Variação da Área Suscetível à Desertificação (ASD):",
    text: `A área selecionada em ${ARIDEZ_BASE_YEAR} tinha ${formatAreaKm2Full(baseAsd)} em ASD. Em ${ano}, passou para ${formatAreaKm2Full(asd)}. ${describeChange(asd, baseAsd)}`,
  };
};

const classBlock = ({ areas, place }: AridezAnaliseInput) => {
  const total = classifiedArea(areas);
  const [first, second] = rankAridezClasses(areas);
  const shareOf = (area: number) => formatSharePercent((area / total) * 100);
  const runnerUp = second
    ? `, seguida de ${second.item.label.toLowerCase()}, com ${shareOf(second.area)}`
    : "";

  return {
    title: "Classificação do índice de aridez:",
    text: `No recorte selecionado (${place}), a classe predominante é ${first.item.label.toLowerCase()}, com ${shareOf(first.area)} da área (${formatAreaKm2(first.area)})${runnerUp}. A área suscetível (ASD) responde por ${formatSharePercent(asdShare(areas))} do total.`,
  };
};

/**
 * Texto do "Veja mais" do painel de aridez (`ANALISE()` de aridez.html): a
 * variação da ASD desde 1991 e a classe predominante. Null sem área
 * classificada, quando o painel já mostra o aviso de sem dados.
 *
 * @example buildAridezAnalise({ ano: 2021, areas, baseAreas, place: "Nordeste", placeFull: "Nordeste" })?.blocks[0].title // "Variação da Área Suscetível à Desertificação (ASD):"
 */
export const buildAridezAnalise = (
  input: AridezAnaliseInput,
): PanelAnalysis | null => {
  if (classifiedArea(input.areas) <= 0) return null;

  return {
    blocks: [asdBlock(input), classBlock(input)],
    footnote: `Texto gerado conforme os filtros: ${input.placeFull} · ${input.ano}.`,
  };
};
