import type {
  ChoroplethRegion,
  ValueFormatter,
} from "@/features/panels/chartOptions";
import { getBucket, type ChoroplethBucket } from "@/features/panels/choropleth";

// Estrutura igual a DataTableContent de src/components/Panel/cards/DataTable.tsx.
// Features não importam de components, então o tipo é declarado aqui.
export type MunicipalMapTable = {
  caption: string;
  columns: string[];
  rows: string[][];
};

export type MunicipalMapTableSpec = {
  caption: string;
  valueLabel: string;
  bucketLabel: string;
  buckets: readonly ChoroplethBucket[];
  formatValue: ValueFormatter;
};

/**
 * Tabela acessível de um mapa de municípios em canvas, que não tem texto para
 * leitores de tela: município, valor e faixa, do maior valor para o menor.
 *
 * @example buildMunicipalMapTable(mapa, { caption: "Porte em 2022", valueLabel: "População", bucketLabel: "Porte", buckets, formatValue }).rows
 */
export const buildMunicipalMapTable = (
  regions: readonly ChoroplethRegion[],
  spec: MunicipalMapTableSpec,
): MunicipalMapTable => ({
  caption: spec.caption,
  columns: ["Município", spec.valueLabel, spec.bucketLabel],
  rows: [...regions]
    .sort((a, b) => b.value - a.value)
    .map((region) => [
      `${region.name} (${region.uf})`,
      spec.formatValue(region.value),
      getBucket(spec.buckets, region.value).label,
    ]),
});
