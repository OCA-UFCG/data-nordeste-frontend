import {
  asdArea,
  asdShare,
  classifiedArea,
  rankAridezClasses,
} from "@/features/panels/aridez/aridezClasses";
import type { AridezMunicipio } from "@/features/panels/aridez/aridezPanel";

/**
 * Número do tooltip e do ranking do mapa: o % da área classificada de cada
 * município que é suscetível à desertificação, por código IBGE. É o mesmo
 * número do card de municípios.
 *
 * @example aridezMapValues([{ cdMun: "2611101", nome: "Petrolina (PE)", areas }]).get("2611101") // 65
 */
export const aridezMapValues = (
  municipios: readonly AridezMunicipio[],
): Map<string, number> =>
  new Map(
    municipios.map(({ cdMun, areas }): [string, number] => [
      cdMun,
      asdShare(areas),
    ]),
  );

/**
 * Classe predominante de cada município (a de maior área; empate fica com a
 * mais seca), por código IBGE. O valor é o `dn_uni` numérico da classe, o
 * mesmo `value` da paleta do mapa. Município sem área classificada fica de
 * fora.
 *
 * @example aridezPredominantClasses(municipios).get("2611101") // 3
 */
export const aridezPredominantClasses = (
  municipios: readonly AridezMunicipio[],
): Map<string, number> => {
  const classOf = new Map<string, number>();

  for (const { cdMun, areas } of municipios) {
    const predominant = rankAridezClasses(areas)[0];

    if (predominant) classOf.set(cdMun, Number(predominant.item.code));
  }

  return classOf;
};

/**
 * Legenda do mapa: em quantos municípios cada classe é a predominante
 * (`aridezPredominantClasses`), pelo valor da classe na paleta.
 *
 * @example aridezClassCounts(municipios).get(3) // 1.200
 */
export const aridezClassCounts = (
  municipios: readonly AridezMunicipio[],
): Map<number, number> => {
  const counts = new Map<number, number>();

  for (const value of aridezPredominantClasses(municipios).values()) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
};

type StateAreas = { asd: number; classified: number };

const sumStateAreas = (
  municipios: readonly AridezMunicipio[],
): Map<string, StateAreas> => {
  const byState = new Map<string, StateAreas>();

  for (const { uf, areas } of municipios) {
    const sum = byState.get(uf) ?? { asd: 0, classified: 0 };

    sum.asd += asdArea(areas);
    sum.classified += classifiedArea(areas);
    byState.set(uf, sum);
  }

  return byState;
};

/**
 * Número do hover por estado do mapa (só a área de interesse ativa): o % da
 * área classificada do estado, dentro da área, que é suscetível à
 * desertificação, por sigla. IMPORTANT: é a razão das áreas somadas, não a
 * média dos % dos municípios (um município pequeno pesaria como um grande).
 * Estado sem área classificada fica de fora ("sem dado" no mapa).
 *
 * @example aridezStateShares(data.mapa).get("PE") // 72,4
 */
export const aridezStateShares = (
  municipios: readonly AridezMunicipio[],
): Map<string, number> => {
  const shares = new Map<string, number>();

  for (const [uf, { asd, classified }] of sumStateAreas(municipios)) {
    if (classified > 0) shares.set(uf, (asd / classified) * 100);
  }

  return shares;
};
