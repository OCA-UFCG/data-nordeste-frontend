import type { MapRecorte } from "@/features/panelMap/mapRecorte";
import type { IdhFilters } from "@/features/panels/idh/idhPanel";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

/** Seleção do mapa a partir dos filtros territoriais. Ex.: sem `uf`/`mun` → recorte vazio. */
export function territorialToRecorte(filters: TerritorialFilters): MapRecorte {
  return { uf: [...(filters.uf ?? [])], mun: [...(filters.mun ?? [])] };
}

/** Aplica o recorte aos filtros, mantendo `ano`/`area`; listas vazias saem do objeto. */
export function recorteToTerritorial(
  filters: TerritorialFilters,
  recorte: MapRecorte,
): TerritorialFilters {
  return {
    ano: filters.ano,
    area: filters.area,
    ...(recorte.uf.length > 0 ? { uf: recorte.uf } : {}),
    ...(recorte.mun.length > 0 ? { mun: recorte.mun } : {}),
  };
}

/** O IDH tem um estado só e nenhum município. Ex.: `{ uf: "PE" }` → `{ uf: ["PE"], mun: [] }`. */
export function idhToRecorte(filters: IdhFilters): MapRecorte {
  return { uf: filters.uf ? [filters.uf] : [], mun: [] };
}

/** Aplica o recorte ao IDH usando só `uf[0]`; sem estado, `uf` sai do objeto. */
export function recorteToIdh(
  filters: IdhFilters,
  recorte: MapRecorte,
): IdhFilters {
  const [uf] = recorte.uf;

  return {
    ano: filters.ano,
    visao: filters.visao,
    ...(uf ? { uf } : {}),
  };
}
