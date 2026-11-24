import type { ChoroplethRegion } from "@/features/panels/chartOptions";
import { getBucket, type ChoroplethBucket } from "@/features/panels/choropleth";
import { formatIdh } from "@/features/panels/idh/idhFormat";
import {
  IDH_MAP_BUCKETS,
  type IdhPanelData,
} from "@/features/panels/idh/idhPanel";

export type IdhRankedState = {
  code: string;
  label: string;
  value: number;
  color: string;
};

/**
 * Faixa de desenvolvimento humano do PNUD. O limite entra na faixa de cima
 * (0,700 já é "Alto"), como no mapa.
 *
 * @example idhClassFor(0.734).label // "Alto"
 */
export const idhClassFor = (value: number): ChoroplethBucket =>
  getBucket(IDH_MAP_BUCKETS, value);

/**
 * Estados do maior para o menor IDH, cada um na cor da sua faixa: o ranking
 * usa as mesmas cores do mapa ao lado, para os dois se lerem juntos.
 *
 * @example rankIdhStates(panel.mapa)[0] // { code: "CE", label: "Ceará", value: 0.734, color: "#00bd47" }
 */
export const rankIdhStates = (mapa: ChoroplethRegion[]): IdhRankedState[] =>
  [...mapa]
    .sort((a, b) => b.value - a.value)
    .map((region) => ({
      code: region.code,
      label: region.name,
      value: region.value,
      color: idhClassFor(region.value).color,
    }));

/**
 * Linha de apoio do card de IDH quando há um estado no filtro. Sem estado, o
 * card mostra a média do Nordeste, que não tem faixa própria no protótipo.
 *
 * @example describeIdhClass(panel) // "Ceará · faixa alto"
 */
export const describeIdhClass = ({
  filters,
  ufs,
  serie,
}: Pick<IdhPanelData, "filters" | "ufs" | "serie">): string | undefined => {
  const uf = ufs.find((item) => item.sigla === filters.uf);
  const point = serie.find((item) => item.ano === filters.ano);

  if (!uf || !point) return undefined;

  return `${uf.nome} · faixa ${idhClassFor(point.idh).label.toLowerCase()}`;
};

// O IDH tem três casas: o fim de uma faixa é o limite da próxima menos 0,001.
const IDH_STEP = 0.001;

// Intervalo da legenda do protótipo ("0,700–0,799"), tirado dos limites do
// próprio IDH_MAP_BUCKETS para os dois não divergirem.
const describeClassRange = (index: number): string => {
  const { max } = IDH_MAP_BUCKETS[index];
  const min = IDH_MAP_BUCKETS[index - 1]?.max;

  if (min === undefined) return `< ${formatIdh(max)}`;
  if (max === Infinity) return `≥ ${formatIdh(min)}`;

  return `${formatIdh(min)}–${formatIdh(max - IDH_STEP)}`;
};

export type IdhLegendItem = {
  label: string;
  range: string;
  color: string;
  count: number;
};

/**
 * Legenda do mapa: as cinco faixas, com o intervalo e quantos estados caem em
 * cada uma (o protótipo mostra "Alto (0,700–0,799) · 4").
 *
 * @example buildIdhLegend(panel.mapa)[3] // { label: "Alto", range: "0,700–0,799", color: "#00bd47", count: 4 }
 */
export const buildIdhLegend = (mapa: ChoroplethRegion[]): IdhLegendItem[] =>
  IDH_MAP_BUCKETS.map((bucket, index) => ({
    label: bucket.label,
    range: describeClassRange(index),
    color: bucket.color,
    count: mapa.filter((region) => idhClassFor(region.value) === bucket).length,
  }));
