import { getBucket, type ChoroplethBucket } from "@/features/panels/choropleth";
import { formatPibReais } from "@/features/panels/pib/pibFormat";
import type { PibStateRegion } from "@/features/panels/pib/pibPanel";

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

/**
 * Leitura do mapa do PIB por código de estado: a faixa da cor, o texto
 * acessível e se o estado pode ser escolhido (só os da área de interesse).
 * Fora da área, a faixa é nula e o painel pinta com a cor de fora da área.
 *
 * @example buildPibStateLookup(estados).describe("PE") // "Pernambuco, R$ 232,10 Bi"
 */
export const buildPibStateLookup = (estados: readonly PibStateRegion[]) => {
  const byCode = new Map(estados.map((estado) => [estado.code, estado]));

  return {
    binFor: (code: string): ChoroplethBucket | null => {
      const estado = byCode.get(code);

      return estado ? pibStateBin(estado.value) : null;
    },
    describe: (code: string): string => {
      const estado = byCode.get(code);

      return estado
        ? `${estado.name}, ${formatPibReais(estado.value)}`
        : `${code}, fora da área`;
    },
    isSelectable: (code: string): boolean => byCode.has(code),
  };
};
