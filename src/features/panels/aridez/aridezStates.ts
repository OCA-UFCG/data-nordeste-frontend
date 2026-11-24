import type { AridezStateRegion } from "@/features/panels/aridez/aridezPanel";
import { formatPercent } from "@/features/panels/format";
import { getBucket, type ChoroplethBucket } from "@/features/panels/choropleth";

// Faixas do % da área do estado suscetível à desertificação (`BINS` do protótipo).
export const ARIDEZ_STATE_BINS: readonly ChoroplethBucket[] = [
  { max: 20, label: "< 20%", color: "#feeed6" },
  { max: 40, label: "20 – 40%", color: "#fabd77" },
  { max: 60, label: "40 – 60%", color: "#f5791a" },
  { max: 80, label: "60 – 80%", color: "#be4610" },
  { max: Infinity, label: "≥ 80%", color: "#7a3014" },
];

/**
 * Leitura do mapa da aridez por código de estado: a faixa da cor, o texto
 * acessível e se o estado pode ser escolhido (só os da área de interesse).
 *
 * @example buildAridezStateLookup(estados).describe("CE") // "Ceará, 91,9% da área suscetível"
 */
export const buildAridezStateLookup = (
  estados: readonly AridezStateRegion[],
) => {
  const byCode = new Map(estados.map((estado) => [estado.code, estado]));

  return {
    binFor: (code: string): ChoroplethBucket | null => {
      const estado = byCode.get(code);

      return estado ? getBucket(ARIDEZ_STATE_BINS, estado.value) : null;
    },
    describe: (code: string): string => {
      const estado = byCode.get(code);

      return estado
        ? `${estado.name}, ${formatPercent(estado.value)} da área suscetível`
        : `${code}, fora da área`;
    },
    isSelectable: (code: string): boolean => byCode.has(code),
  };
};
