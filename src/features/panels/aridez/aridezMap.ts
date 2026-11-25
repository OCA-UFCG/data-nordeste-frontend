import type { MapTooltipDetails } from "@/features/panelMap/mapTooltip";
import {
  ARIDEZ_CLASSES,
  type AridezAreas,
  type AridezClassKey,
  asdShare,
  classifiedArea,
  classShares,
  EMPTY_ARIDEZ_AREAS,
  rankAridezClasses,
} from "@/features/panels/aridez/aridezClasses";
import type { AridezMunicipio } from "@/features/panels/aridez/aridezPanel";
import { formatSharePercent } from "@/features/panels/aridez/aridezFormat";

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

// O tooltip concorda em gênero com "área" ("Percentual de área semiárida").
const CLASS_ADJECTIVES: Record<AridezClassKey, string> = {
  arido: "árida",
  semiarido: "semiárida",
  subumido: "subúmida seca",
  umido: "úmida",
};

const addAreas = (total: AridezAreas, areas: AridezAreas): AridezAreas => {
  const sum = { ...total };

  for (const { key } of ARIDEZ_CLASSES) sum[key] += areas[key];

  return sum;
};

// Área de cada classe somada por UF; a soma das classes (não a média dos %)
// é o que faz a razão do estado.
const sumStateAreas = (
  municipios: readonly AridezMunicipio[],
): Map<string, AridezAreas> => {
  const byState = new Map<string, AridezAreas>();

  for (const { uf, areas } of municipios) {
    const sum = byState.get(uf) ?? { ...EMPTY_ARIDEZ_AREAS };

    byState.set(uf, addAreas(sum, areas));
  }

  return byState;
};

// Uma linha por classe com área, na ordem das classes: "Percentual de área
// semiárida: 90,00%". Classe sem área fica de fora.
const classShareLines = (areas: AridezAreas): string[] => {
  const shares = classShares(areas);

  return ARIDEZ_CLASSES.filter(({ key }) => shares[key] > 0).map(
    ({ key }) =>
      `Percentual de área ${CLASS_ADJECTIVES[key]}: ${formatSharePercent(shares[key])}`,
  );
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

  for (const [uf, areas] of sumStateAreas(municipios)) {
    if (classifiedArea(areas) > 0) shares.set(uf, asdShare(areas));
  }

  return shares;
};

/**
 * Linhas extras do tooltip do mapa de aridez: o % de cada classe da área do
 * município (por `cdMun`) e do estado (por UF, com as áreas somadas). Classe
 * sem área não aparece.
 *
 * @example aridezTooltipDetails(municipios).feature.get("2611101") // ["Percentual de área semiárida: 90,00%", "Percentual de área úmida: 10,00%"]
 */
export const aridezTooltipDetails = (
  municipios: readonly AridezMunicipio[],
): MapTooltipDetails => {
  const feature = new Map<string, string[]>(
    municipios.map(({ cdMun, areas }) => [cdMun, classShareLines(areas)]),
  );
  const state = new Map<string, string[]>(
    [...sumStateAreas(municipios)].map(([uf, areas]) => [
      uf,
      classShareLines(areas),
    ]),
  );

  return { feature, state };
};
