import { getBucket, type ChoroplethBucket } from "@/features/panels/choropleth";
import type { PibStateRegion } from "@/features/panels/pib/pibPanel";
import { STATE_PATHS } from "@/features/panels/stateShapes";

// Faixas do PIB total por estado no mapa (`BINS` do protótipo), em reais.
export const PIB_STATE_BINS: readonly ChoroplethBucket[] = [
  { max: 50e9, label: "< R$ 50 Bi", color: "#feebd7" },
  { max: 100e9, label: "R$ 50 – 100 Bi", color: "#fbc99a" },
  { max: 200e9, label: "R$ 100 – 200 Bi", color: "#f79339" },
  { max: 300e9, label: "R$ 200 – 300 Bi", color: "#d9600c" },
  { max: Infinity, label: "> R$ 300 Bi", color: "#973815" },
];

/**
 * Faixa de um estado no mapa do PIB.
 *
 * @example pibStateBin(232e9).label // "R$ 200 – 300 Bi"
 */
export const pibStateBin = (value: number): ChoroplethBucket =>
  getBucket(PIB_STATE_BINS, value);

const joinNames = (names: string[]): string =>
  names.length > 1
    ? `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`
    : names[0];

/**
 * Aviso dos estados que têm dado na área mas não cabem no mapa: ele desenha
 * só os nove do Nordeste, e a Área da Sudene e o Semiárido incluem parte de
 * Minas Gerais e do Espírito Santo. Null quando todos aparecem.
 *
 * @example describeStatesOffMap(estados) // "Espírito Santo e Minas Gerais integram a área, mas não aparecem no mapa · selecione no filtro Estado."
 */
export const describeStatesOffMap = (
  estados: readonly PibStateRegion[],
): string | null => {
  const names = estados
    .filter((estado) => !(estado.code in STATE_PATHS))
    .map((estado) => estado.name);

  if (!names.length) return null;
  const plural = names.length > 1;

  return `${joinNames(names)} ${plural ? "integram" : "integra"} a área, mas ${plural ? "não aparecem" : "não aparece"} no mapa · selecione no filtro Estado.`;
};
