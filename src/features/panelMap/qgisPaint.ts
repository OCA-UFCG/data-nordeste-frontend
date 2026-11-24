import type { ExpressionSpecification } from "maplibre-gl";

import type {
  GeodataStyles,
  PanelIndicator,
  QgisClass,
  QgisOutline,
} from "@/features/panelMap/geodataTypes";

export const NO_DATA_COLOR = "#d9d9d9";

/** Nome da propriedade da feição para um ano: `yearField(2023)` → `"v2023"`. */
export function yearField(ano: number): string {
  return `v${ano}`;
}

// INTENTIONAL: semântica do QGIS para graduadas. A 1ª classe é fechada nos dois
// lados; as demais são abertas embaixo. Classe com lower > upper não casa nunca
// — o dado do qgz é reproduzido como veio, não corrigido.
function classContains(
  classes: QgisClass[],
  index: number,
  value: number,
): boolean {
  const { lower, upper } = classes[index];
  const aboveLower = index === 0 ? value >= lower : value > lower;

  return aboveLower && value <= upper;
}

/**
 * Classe que pinta `value`, ou `null` quando não há valor ou nenhuma casa.
 * Ex.: `classForValue(classes, 500000000)` → 1ª classe (borda superior inclusiva).
 */
export function classForValue(
  classes: QgisClass[],
  value: number | null,
): QgisClass | null {
  if (typeof value !== "number") return null;

  const index = classes.findIndex((_, position) =>
    classContains(classes, position, value),
  );

  return index === -1 ? null : classes[index];
}

function classCondition(
  field: ExpressionSpecification,
  classes: QgisClass[],
  index: number,
): ExpressionSpecification {
  const { lower, upper } = classes[index];
  const lowerTest = index === 0 ? ">=" : ">";

  return ["all", [lowerTest, field, lower], ["<=", field, upper]];
}

function hasNoNumberCondition(
  field: ExpressionSpecification,
): ExpressionSpecification {
  // WHY: o ExpressionSpecification do maplibre 4.7.1 não tipa o operador
  // `typeof`, embora a expressão exista em runtime.
  const isNumber = [
    "==",
    ["typeof", field],
    "number",
  ] as unknown as ExpressionSpecification;

  return ["!", isNumber];
}

/**
 * Expressão `case` do MapLibre com a mesma semântica de `classForValue`.
 * `v<ano>` ausente, `null` ou não numérico cai em NO_DATA_COLOR.
 * Ex.: `paint["fill-color"] = classColorExpression(style.classes, 2023)`.
 */
export function classColorExpression(
  classes: QgisClass[],
  ano: number,
): ExpressionSpecification {
  const field: ExpressionSpecification = ["get", yearField(ano)];
  const branches = classes.flatMap((item, index) => [
    classCondition(field, classes, index),
    item.color,
  ]);

  return [
    "case",
    hasNoNumberCondition(field),
    NO_DATA_COLOR,
    ...branches,
    NO_DATA_COLOR,
  ] as ExpressionSpecification;
}

// Com o raster da aridez por baixo o preenchimento some, mas as feições
// continuam lá: contornos, véu, hover e tooltip seguem funcionando.
export const TRANSPARENT_FILL: ExpressionSpecification = [
  "to-color",
  "rgba(0,0,0,0)",
];

/**
 * Cor do preenchimento das feições: as classes do ano, ou transparente quando
 * um raster é a camada principal do mapa.
 * Ex.: `indicatorFillColor(classes, 2023, true)` → `TRANSPARENT_FILL`.
 */
export function indicatorFillColor(
  classes: QgisClass[],
  ano: number,
  rasterBase: boolean,
): ExpressionSpecification {
  return rasterBase ? TRANSPARENT_FILL : classColorExpression(classes, ano);
}

export type FeaturePaint = {
  color: ExpressionSpecification;
  outline: QgisOutline;
};

/**
 * Preenchimento e contorno das feições do indicador. A aridez não tem `.qgz`
 * de feição: fica transparente sobre o raster, com o contorno dos estados
 * (mesma cor e largura dos municipais nos outros `.qgz`).
 * Ex.: `featurePaint(styles, "aridez", 2021, true).color` → `TRANSPARENT_FILL`.
 */
export function featurePaint(
  styles: GeodataStyles,
  indicator: PanelIndicator,
  ano: number,
  rasterBase: boolean,
): FeaturePaint {
  if (indicator === "aridez") {
    return { color: TRANSPARENT_FILL, outline: styles.stateOutline };
  }
  const style = styles.indicators[indicator];

  return {
    color: indicatorFillColor(style.classes, ano, rasterBase),
    outline: style.outline,
  };
}
