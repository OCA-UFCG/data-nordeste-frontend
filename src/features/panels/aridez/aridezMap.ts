import {
  asdShare,
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
 * Legenda do mapa: em quantos municípios cada classe é a predominante (a de
 * maior área; empate fica com a mais seca). A chave é o `dn_uni` numérico da
 * classe, o mesmo `value` da paleta do mapa. Município sem área classificada
 * não conta.
 *
 * @example aridezClassCounts(municipios).get(3) // 1.200
 */
export const aridezClassCounts = (
  municipios: readonly AridezMunicipio[],
): Map<number, number> => {
  const counts = new Map<number, number>();

  for (const { areas } of municipios) {
    const predominant = rankAridezClasses(areas)[0];

    if (!predominant) continue;
    const code = Number(predominant.item.code);

    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  return counts;
};
