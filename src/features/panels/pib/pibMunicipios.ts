import type { ChoroplethBucket } from "@/features/panels/choropleth";
import {
  buildMunicipalMapTable,
  type MunicipalMapTable,
} from "@/features/panels/municipalMapTable";
import { formatPibReais } from "@/features/panels/pib/pibFormat";
import type { PibPanelData } from "@/features/panels/pib/pibPanel";

// Faixas fixas, em reais, para os anos se compararem (preços correntes). O PIB
// municipal é muito concentrado: em 2023 a mediana da Sudene é ~R$ 200 Mi e o
// maior passa de R$ 80 Bi, então os cortes crescem em escala quase logarítmica.
// O 50 Mi separa os pequenos dos primeiros anos (43% abaixo dele em 2010).
export const PIB_MUNICIPAL_BINS: readonly ChoroplethBucket[] = [
  { max: 50e6, label: "< R$ 50 Mi", color: "#feebd7" },
  { max: 100e6, label: "R$ 50 – 100 Mi", color: "#fdd0a2" },
  { max: 250e6, label: "R$ 100 – 250 Mi", color: "#fbab64" },
  { max: 1e9, label: "R$ 250 Mi – 1 Bi", color: "#f2761c" },
  { max: 5e9, label: "R$ 1 – 5 Bi", color: "#c4520a" },
  { max: Infinity, label: "> R$ 5 Bi", color: "#7f2d10" },
];

/**
 * Tabela acessível do mapa do PIB por município (o canvas não tem texto).
 *
 * @example buildPibMunicipalTable(panel).columns // ["Município", "PIB total", "Faixa"]
 */
export const buildPibMunicipalTable = (
  data: Pick<PibPanelData, "mapa" | "filters">,
): MunicipalMapTable =>
  buildMunicipalMapTable(data.mapa, {
    caption: `PIB total por município em ${data.filters.ano}`,
    valueLabel: "PIB total",
    bucketLabel: "Faixa",
    buckets: PIB_MUNICIPAL_BINS,
    formatValue: formatPibReais,
  });

export type PibMapFocus = {
  highlightCodes?: ReadonlySet<string>;
  selectedCode?: string;
};

/**
 * Destaque dos municípios do filtro no mapa: os demais ficam cinza e, com um
 * só, o mapa aproxima e contorna esse município.
 *
 * @example pibMapFocus(["2611606"]).selectedCode // "2611606"
 */
export const pibMapFocus = (mun: readonly string[] = []): PibMapFocus => {
  if (!mun.length) return {};

  return {
    highlightCodes: new Set(mun),
    selectedCode: mun.length === 1 ? mun[0] : undefined,
  };
};
