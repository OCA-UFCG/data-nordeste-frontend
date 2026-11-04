import { escapeHtml } from "@/features/panels/chartBase";
import { getBucket, type ChoroplethBucket } from "@/features/panels/choropleth";
import type { FneVisao } from "@/features/panels/fne/fneFilters";
import {
  FNE_MAP_BUCKETS,
  formatQuantidade,
  formatValor,
} from "@/features/panels/fne/fneLabels";
import type { FneMapRegion } from "@/features/panels/fne/fnePanel";
import type { LayeredRegion } from "@/features/panels/layeredMap";

// Nomes das camadas no mapa do ArcGIS, um por ano e indicador.
const LAYER_SUFFIX: Record<FneVisao, string> = {
  quantidade: "Quantidade total contratada",
  valor: "Valor total contratado (em reais)",
};

export const fneLayerTitle = (ano: number, visao: FneVisao): string =>
  `FNE ${ano} – ${LAYER_SUFFIX[visao]}`;

const tooltipLine = (label: string, value: string, active: boolean) =>
  active ? `<strong>${label}: ${value}</strong>` : `${label}: ${value}`;

const fneTooltip = (region: FneMapRegion, visao: FneVisao): string =>
  [
    `<strong>${escapeHtml(`${region.name} (${region.uf})`)}</strong>`,
    `Código IBGE: ${region.code}`,
    tooltipLine(
      "Quantidade de contratações",
      formatQuantidade(region.quantidade),
      visao === "quantidade",
    ),
    tooltipLine(
      "Valor contratado",
      formatValor(region.valor),
      visao === "valor",
    ),
    `Ticket médio: ${formatValor(region.ticketMedio)}`,
  ].join("<br/>");

/**
 * Colours each municipality by the metric of the active tab.
 * @example toFneLayeredRegions(data.mapa, "valor")
 */
export const toFneLayeredRegions = (
  mapa: FneMapRegion[],
  visao: FneVisao,
): LayeredRegion[] =>
  mapa.map((region) => ({
    code: region.code,
    color: getBucket(FNE_MAP_BUCKETS[visao], region[visao]).color,
    tooltip: fneTooltip(region, visao),
  }));

export type FneBucketGroup = { bucket: ChoroplethBucket; codes: string[] };

/**
 * Municipalities of each map class, for the legend counts and highlight.
 * @example groupFneRegionsByBucket(data.mapa, "quantidade")[0].codes.length
 */
export const groupFneRegionsByBucket = (
  mapa: FneMapRegion[],
  visao: FneVisao,
): FneBucketGroup[] =>
  FNE_MAP_BUCKETS[visao].map((bucket) => ({
    bucket,
    codes: mapa
      .filter(
        (region) => getBucket(FNE_MAP_BUCKETS[visao], region[visao]) === bucket,
      )
      .map((region) => region.code),
  }));

/**
 * Codes of the municipalities of one state on the map, to light it up when
 * the state bar is hovered.
 * @example fneStateCodes(data.mapa, "PE")
 */
export const fneStateCodes = (mapa: FneMapRegion[], sigla: string): string[] =>
  mapa.filter((region) => region.uf === sigla).map((region) => region.code);
