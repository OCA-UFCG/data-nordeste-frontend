"use client";

import { useCallback, useMemo } from "react";
import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
import type { MapRecorte } from "@/features/panelMap/mapRecorte";
import {
  recorteToTerritorial,
  territorialToRecorte,
} from "@/features/panelMap/panelMapAdapters";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

export type PanelMapFilterProps = Pick<
  PanelMapProps,
  "ano" | "area" | "recorte" | "onRecorteChange"
>;

/** Como os filtros de um painel viram o recorte do mapa e voltam dele. */
export type RecorteAdapter<Filters> = {
  toRecorte: (filters: Filters) => MapRecorte;
  fromRecorte: (filters: Filters, recorte: MapRecorte) => Filters;
};

const TERRITORIAL_ADAPTER: RecorteAdapter<TerritorialFilters> = {
  toRecorte: territorialToRecorte,
  fromRecorte: recorteToTerritorial,
};

/**
 * Núcleo do vínculo entre o mapa e os filtros do painel: `selection` vira o
 * recorte que o mapa mostra, e o recorte que o zoom emite volta como filtros
 * para o `request` da barra. Cada painel passa o seu `adapter`.
 *
 * IMPORTANT: o recorte vem direto de `selection` e volta direto para o
 * `request`. O PanelMap só evita reenquadrar se o recorte que recebe depois
 * for igual ao que emitiu; normalizar em qualquer ponto do caminho faria o
 * mapa "pular" a cada zoom.
 *
 * @example const { recorte, onRecorteChange } = useRecorteFilters(selection, IDH_ADAPTER, request);
 */
export const useRecorteFilters = <Filters>(
  selection: Filters,
  adapter: RecorteAdapter<Filters>,
  onFiltersChange: (filters: Filters) => void,
): Pick<PanelMapFilterProps, "recorte" | "onRecorteChange"> => {
  const recorte = useMemo(
    () => adapter.toRecorte(selection),
    [adapter, selection],
  );
  const onRecorteChange = useCallback(
    (next: MapRecorte) => onFiltersChange(adapter.fromRecorte(selection, next)),
    [adapter, selection, onFiltersChange],
  );

  return { recorte, onRecorteChange };
};

/**
 * Liga o recorte do mapa aos filtros territoriais (Ano, Área, Estado e
 * Município) de um painel.
 *
 * @example const mapProps = { ...usePanelMapFilters(selection, request), indicator: "pib", ... };
 */
export const usePanelMapFilters = (
  selection: TerritorialFilters,
  onFiltersChange: (filters: TerritorialFilters) => void,
): PanelMapFilterProps => ({
  ano: selection.ano,
  area: selection.area,
  ...useRecorteFilters(selection, TERRITORIAL_ADAPTER, onFiltersChange),
});
