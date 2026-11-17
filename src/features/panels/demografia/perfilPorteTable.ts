import { getBucket } from "@/features/panels/choropleth";
import { formatPessoas } from "@/features/panels/format";
import {
  DEMOGRAFIA_PORTES,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";

// Estrutura igual a DataTableContent de src/components/Panel/cards/DataTable.tsx.
// Features não importam de components, então o tipo é declarado aqui.
export type PerfilPorteTable = {
  caption: string;
  columns: string[];
  rows: string[][];
};

/**
 * Tabela acessível do mapa de portes: a versão em canvas não tem texto para
 * leitores de tela, então esta tabela ocupa esse papel. Ordena do município
 * mais populoso para o menos populoso.
 *
 * @example buildPerfilPorteTable({ mapa: [], filters }).rows // []
 */
export const buildPerfilPorteTable = (
  data: Pick<DemografiaPanelData, "mapa" | "filters">,
): PerfilPorteTable => ({
  caption: `Porte dos municípios em ${data.filters.ano}`,
  columns: ["Município", "População", "Porte"],
  rows: [...data.mapa]
    .sort((a, b) => b.value - a.value)
    .map((region) => [
      `${region.name} (${region.uf})`,
      formatPessoas(region.value),
      getBucket(DEMOGRAFIA_PORTES, region.value).label,
    ]),
});
