// Classes do índice de aridez, da mais seca para a mais úmida. `code` é o
// `dn_uni` de meio_aridez.vw_aridez, o mesmo que o Automatic-Reporting lê
// (relatorios_auto.ambiente): 2 árido, 3 semiárido, 4 subúmido seco, 5 úmido.
// As cores são as do protótipo (`CL` em aridez.html); `ink` é o texto sobre a cor.
export const ARIDEZ_CLASSES = [
  { key: "arido", code: "2", label: "Árido", color: "#bf1621", ink: "#fff" },
  {
    key: "semiarido",
    code: "3",
    label: "Semiárido",
    color: "#f5791a",
    ink: "#1b1a1c",
  },
  {
    key: "subumido",
    code: "4",
    label: "Subúmido seco",
    color: "#cce076",
    ink: "#1b1a1c",
  },
  { key: "umido", code: "5", label: "Úmido", color: "#1995c1", ink: "#fff" },
] as const;

export type AridezClass = (typeof ARIDEZ_CLASSES)[number];

export type AridezClassKey = AridezClass["key"];

// Área em km² de cada classe num território.
export type AridezAreas = Record<AridezClassKey, number>;

// IMPORTANT: Área Suscetível à Desertificação (ASD) é árido + semiárido +
// subúmido seco, índice abaixo de 0,65 (critério da UNCCD). O úmido fica fora.
const ASD_KEYS: readonly AridezClassKey[] = ["arido", "semiarido", "subumido"];

export const EMPTY_ARIDEZ_AREAS: AridezAreas = {
  arido: 0,
  semiarido: 0,
  subumido: 0,
  umido: 0,
};

/**
 * Área classificada: a soma das quatro classes, base dos percentuais.
 *
 * @example classifiedArea({ arido: 1, semiarido: 2, subumido: 3, umido: 4 }) // 10
 */
export const classifiedArea = (areas: AridezAreas): number =>
  ARIDEZ_CLASSES.reduce((sum, item) => sum + areas[item.key], 0);

/**
 * Área suscetível à desertificação, em km².
 *
 * @example asdArea({ arido: 1, semiarido: 2, subumido: 3, umido: 4 }) // 6
 */
export const asdArea = (areas: AridezAreas): number =>
  ASD_KEYS.reduce((sum, key) => sum + areas[key], 0);

/**
 * Parte da área classificada que é suscetível à desertificação, de 0 a 100.
 * Sem área classificada, 0.
 *
 * @example asdShare({ arido: 1, semiarido: 2, subumido: 3, umido: 4 }) // 60
 */
export const asdShare = (areas: AridezAreas): number => {
  const total = classifiedArea(areas);

  return total > 0 ? (asdArea(areas) / total) * 100 : 0;
};

/**
 * Parte da área classificada em cada classe, de 0 a 100.
 *
 * @example classShares({ arido: 0, semiarido: 1, subumido: 0, umido: 3 }).umido // 75
 */
export const classShares = (areas: AridezAreas): AridezAreas => {
  const total = classifiedArea(areas);
  const share = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  return {
    arido: share(areas.arido),
    semiarido: share(areas.semiarido),
    subumido: share(areas.subumido),
    umido: share(areas.umido),
  };
};

type RankedAridezClass = { item: AridezClass; area: number };

/**
 * Classes com área, da maior para a menor; empate fica na ordem das classes.
 *
 * @example rankAridezClasses({ arido: 0, semiarido: 5, subumido: 2, umido: 0 })[0].item.label // "Semiárido"
 */
export const rankAridezClasses = (areas: AridezAreas): RankedAridezClass[] =>
  ARIDEZ_CLASSES.map((item) => ({ item, area: areas[item.key] }))
    .filter((entry) => entry.area > 0)
    .sort((a, b) => b.area - a.area);
