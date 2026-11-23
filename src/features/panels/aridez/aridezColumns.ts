import {
  ARIDEZ_CLASSES,
  classShares,
  type AridezAreas,
  type AridezClass,
} from "@/features/panels/aridez/aridezClasses";
import { areaUnit, type AreaUnit } from "@/features/panels/aridez/aridezFormat";
import { buildZeroAxis, type ZeroAxis } from "@/features/panels/zeroAxis";

// `height`: altura da coluna, de 0 a 1 do eixo; `percent`: % da área classificada.
export type AridezColumn = {
  item: AridezClass;
  area: number;
  height: number;
  percent: number;
};

export type AridezColumns = {
  columns: AridezColumn[];
  unit: AreaUnit;

  // Eixo na unidade de `unit` (ex.: 0 a 0,8 para "Mi").
  axis: ZeroAxis;
};

/**
 * Colunas do card "Índice de aridez (km²)": uma por classe, na ordem do índice,
 * com o eixo a partir de zero na unidade que o maior valor pede.
 *
 * @example buildAridezColumns({ arido: 0, semiarido: 774_000, subumido: 230_000, umido: 540_000 }).axis.ticks // [0, 0.2, 0.4, 0.6, 0.8]
 */
export const buildAridezColumns = (areas: AridezAreas): AridezColumns => {
  const highest = Math.max(...ARIDEZ_CLASSES.map(({ key }) => areas[key]), 0);
  const unit = areaUnit(highest);
  const axis = buildZeroAxis(highest / unit.divisor);
  const shares = classShares(areas);

  return {
    unit,
    axis,
    columns: ARIDEZ_CLASSES.map((item) => ({
      item,
      area: areas[item.key],
      height: axis.max > 0 ? areas[item.key] / unit.divisor / axis.max : 0,
      percent: shares[item.key],
    })),
  };
};
