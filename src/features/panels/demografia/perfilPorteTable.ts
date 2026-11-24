import { formatPessoas } from "@/features/panels/format";
import {
  DEMOGRAFIA_PORTES,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";
import {
  buildMunicipalMapTable,
  type MunicipalMapTable,
} from "@/features/panels/municipalMapTable";

/**
 * Tabela acessível do mapa de portes: a versão em canvas não tem texto para
 * leitores de tela, então esta tabela ocupa esse papel. Ordena do município
 * mais populoso para o menos populoso.
 *
 * @example buildPerfilPorteTable({ mapa: [], filters }).rows // []
 */
export const buildPerfilPorteTable = (
  data: Pick<DemografiaPanelData, "mapa" | "filters">,
): MunicipalMapTable =>
  buildMunicipalMapTable(data.mapa, {
    caption: `Porte populacional em ${data.filters.ano}`,
    valueLabel: "População",
    bucketLabel: "Porte",
    buckets: DEMOGRAFIA_PORTES,
    formatValue: formatPessoas,
  });
