"use client";

import { useCallback, useMemo } from "react";
import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
import {
  recorteToTerritorial,
  territorialToRecorte,
} from "@/features/panelMap/panelMapAdapters";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

export type PanelMapFilterProps = Pick<
  PanelMapProps,
  "ano" | "area" | "recorte" | "onRecorteChange"
>;

/**
 * Liga o recorte do mapa aos filtros do painel: `selection` vira o recorte que
 * o mapa mostra, e o recorte que o zoom emite volta como filtros para o
 * `request` da barra.
 *
 * IMPORTANT: o recorte vem direto de `selection` e volta direto para o
 * `request`. O PanelMap só evita reenquadrar se o recorte que recebe depois
 * for igual ao que emitiu; normalizar em qualquer ponto do caminho faria o
 * mapa "pular" a cada zoom.
 *
 * @example const mapProps = { ...usePanelMapFilters(selection, request), indicator: "pib", ... };
 */
export const usePanelMapFilters = (
  selection: TerritorialFilters,
  onFiltersChange: (filters: TerritorialFilters) => void,
): PanelMapFilterProps => {
  const recorte = useMemo(() => territorialToRecorte(selection), [selection]);
  const onRecorteChange = useCallback(
    (next: Parameters<PanelMapProps["onRecorteChange"]>[0]) =>
      onFiltersChange(recorteToTerritorial(selection, next)),
    [selection, onFiltersChange],
  );

  return { ano: selection.ano, area: selection.area, recorte, onRecorteChange };
};
