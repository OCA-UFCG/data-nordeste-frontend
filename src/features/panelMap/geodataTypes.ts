export type PanelIndicator = "pib" | "demografia" | "idh";

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

export type GeodataStyles = {
  indicators: Record<PanelIndicator, IndicatorStyle>;
  stateOutline: QgisOutline;
  aridez: { value: number; color: string; label: string }[];
};

export type GeodataManifest = {
  generatedAt: string;
  years: Record<PanelIndicator, number[]>;
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
