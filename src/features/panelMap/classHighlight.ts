import type { ExpressionSpecification, FilterSpecification } from "maplibre-gl";

import type {
  AridezPaletteEntry,
  QgisClass,
} from "@/features/panelMap/geodataTypes";
import { propertyIn } from "@/features/panelMap/mapLayers";
import {
  classCondition,
  hasNoNumberCondition,
  isNumberCondition,
  yearField,
} from "@/features/panelMap/qgisPaint";

/** Classe destacada pela legenda: a posição no `.qgz` ou "Sem dado". */
export type ClassHighlightKey = number | "nodata";

function classConditions(
  field: ExpressionSpecification,
  classes: QgisClass[],
  count: number,
): ExpressionSpecification[] {
  return classes
    .slice(0, count)
    .map((_, index) => classCondition(field, classes, index));
}

// WHY: o `case` da cor fica com a 1ª classe que casa; com faixas sobrepostas
// no `.qgz` (Pequeno [0, 50 mil] e Grande (10 mil, 4 mi] na demografia) o
// destaque também precisa excluir as classes anteriores.
function noneOf(
  conditions: ExpressionSpecification[],
): ExpressionSpecification[] {
  return conditions.length === 0 ? [] : [["!", ["any", ...conditions]]];
}

function noDataFilter(
  field: ExpressionSpecification,
  classes: QgisClass[],
): FilterSpecification {
  // IMPORTANT: o teste de número vem primeiro: comparar `null` com número é
  // erro de avaliação no MapLibre, e o `any` para no primeiro verdadeiro.
  return [
    "any",
    hasNoNumberCondition(field),
    ...noneOf(classConditions(field, classes, classes.length)),
  ];
}

/**
 * Feições que a classe `key` pinta no ano, com a semântica de
 * `classColorExpression` (1ª classe que casa; "nodata" = sem número ou sem
 * classe, como o "Sem dado" de `countByClass`). Classe invertida do `.qgz`
 * não casa nada, como na cor.
 * Ex.: `classHighlightFilter(classes, 2023, 0)` → os municípios da 1ª classe.
 */
export function classHighlightFilter(
  classes: QgisClass[],
  ano: number,
  key: ClassHighlightKey,
): FilterSpecification {
  const field: ExpressionSpecification = ["get", yearField(ano)];

  if (key === "nodata") return noDataFilter(field, classes);

  return [
    "all",
    isNumberCondition(field),
    classCondition(field, classes, key),
    ...noneOf(classConditions(field, classes, key)),
  ];
}

/**
 * Aridez: os municípios cuja classe predominante (`classOf`, código → valor
 * da classe na paleta) é `value`. O raster não muda; só as feições.
 * Ex.: `predominantClassFilter(new Map([["2611606", 3]]), 3)` → `["in", ["get", "code"], ["literal", ["2611606"]]]`.
 */
export function predominantClassFilter(
  classOf: ReadonlyMap<string, number>,
  value: number,
): FilterSpecification {
  const codes = [...classOf].filter(([, predominant]) => predominant === value);

  return propertyIn(
    "code",
    codes.map(([code]) => code),
  );
}

/** De onde vêm as pílulas da legenda: classes do `.qgz` ou paleta da aridez. */
export type LegendHighlightSource =
  | { kind: "classes"; classes: QgisClass[]; ano: number }
  | {
      kind: "palette";
      palette: AridezPaletteEntry[];
      classOf?: ReadonlyMap<string, number>;
    };

/**
 * Filtro do destaque da pílula `chipIndex`. As pílulas das classes seguem a
 * ordem de `countByClass` (classes do `.qgz`, depois "Sem dado"); as da
 * aridez, a da paleta. Aridez sem `classOf` não destaca (null).
 * Ex.: `chipHighlightFilter({ kind: "classes", classes, ano: 2023 }, classes.length)` → o filtro "nodata".
 */
export function chipHighlightFilter(
  source: LegendHighlightSource,
  chipIndex: number,
): FilterSpecification | null {
  if (source.kind === "classes") {
    const { classes, ano } = source;
    const key = chipIndex < classes.length ? chipIndex : "nodata";

    return classHighlightFilter(classes, ano, key);
  }
  const entry = source.palette[chipIndex];

  if (!entry || !source.classOf) return null;

  return predominantClassFilter(source.classOf, entry.value);
}
