import { STATE_PATHS } from "@/features/panels/stateShapes";

// Basta o código e o nome: serve a qualquer painel com mapa por estado.
export type StateOnMap = { code: string; name: string };

const joinNames = (names: string[]): string =>
  names.length > 1
    ? `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`
    : names[0];

/**
 * Aviso dos estados que têm dado na área mas não cabem no mapa: ele desenha
 * só os nove do Nordeste, e a Área da Sudene e o Semiárido incluem parte de
 * Minas Gerais e do Espírito Santo. Null quando todos aparecem.
 *
 * @example describeStatesOffMap(estados) // "Espírito Santo e Minas Gerais integram a área, mas não aparecem no mapa · selecione no filtro Estado."
 */
export const describeStatesOffMap = (
  estados: readonly StateOnMap[],
): string | null => {
  const names = estados
    .filter((estado) => !(estado.code in STATE_PATHS))
    .map((estado) => estado.name);

  if (!names.length) return null;
  const plural = names.length > 1;

  return `${joinNames(names)} ${plural ? "integram" : "integra"} a área, mas ${plural ? "não aparecem" : "não aparece"} no mapa · selecione no filtro Estado.`;
};
