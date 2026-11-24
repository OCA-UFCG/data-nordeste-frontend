/** Indicadores com classes graduadas no styles.json e anos no manifest. */
export type ChoroplethIndicator = "pib" | "demografia" | "idh";

/**
 * Indicador do mapa. A aridez não tem classes por feição: o raster da década
 * é a camada principal e as feições são a malha municipal (`municipios`).
 */
export type PanelIndicator = ChoroplethIndicator | "aridez";

/** Classe graduada do qgz, como veio do styles.json (limites podem estar invertidos). */
export type QgisClass = {
  lower: number;
  upper: number;
  label: string;
  color: string;
};

export type QgisOutline = { color: string; widthPx: number };

export type IndicatorStyle = {
  attribute: string;
  classes: QgisClass[];
  outline: QgisOutline;
};

/** Classe da paleta do raster da aridez (`indice_aridez.qgz`). */
export type AridezPaletteEntry = {
  value: number;
  color: string;
  label: string;
};

export type GeodataStyles = {
  indicators: Record<ChoroplethIndicator, IndicatorStyle>;
  stateOutline: QgisOutline;
  aridez: AridezPaletteEntry[];
};

export type GeodataManifest = {
  generatedAt: string;
  years: Record<ChoroplethIndicator, number[]>;
  aridez: { years: number[]; bounds: [[number, number], [number, number]] };
};

/**
 * Propriedades das feições de vector/*.geojson. `v<ano>` é ausente quando o
 * arquivo não tem o ano e `null` quando o ano existe sem valor.
 */
export type MapFeatureProps = {
  code: string;
  name: string;
  uf: string;
  nordeste?: number;
  semiarido?: number;
  caatinga?: number;
  sudene?: number;
  [year: `v${number}`]: number | null;
};
