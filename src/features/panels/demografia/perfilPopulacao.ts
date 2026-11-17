import type { DemografiaPanelData } from "@/features/panels/demografia/demografiaPanel";
import {
  describeYearChange,
  type YearChange,
} from "@/features/panels/yearChange";

export type PerfilPopulacao = { value: number; change: YearChange | null };

/**
 * População do ano escolhido e a variação para o censo anterior. Sem o ano
 * na série, ou com população zero, não há o que mostrar: devolve null, e a
 * página mostra o aviso de dados vazios.
 *
 * @example findPerfilPopulacao(panel) // { value: 2208000, change: { ratio: 0.03, previousLabel: "2010" } }
 */
export const findPerfilPopulacao = ({
  serie,
  filters,
}: Pick<DemografiaPanelData, "serie" | "filters">): PerfilPopulacao | null => {
  const index = serie.findIndex((point) => point.label === String(filters.ano));
  const point = serie[index];

  if (!point || point.value === 0) return null;

  return { value: point.value, change: describeYearChange(serie, index) };
};
