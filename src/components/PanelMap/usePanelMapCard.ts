"use client";

import { useState } from "react";

import { panelMapImageSource } from "@/components/PanelMap/panelMapTexts";
import type { ReadyGeodata } from "@/components/PanelMap/useGeodata";
import { DEFAULT_BASEMAP } from "@/components/PanelMap/usePanelMapEngine";
import type { BasemapKind, PanelMapEngine } from "@/lib/panelMapEngine";

/**
 * O que o card guarda do `PanelMap` de dentro dele: o motor (para baixar a
 * imagem), o basemap ativo (para o crédito dessa imagem) e os geodados (a
 * legenda e o mini-mapa do cartaz; `null` até carregarem). `mapBinding` vai
 * direto no `PanelMap` do card, já com os gestos cooperativos; o da tela
 * cheia não o recebe.
 *
 * @example const card = usePanelMapCard(PIB_CARD_SOURCE); <PanelMap {...mapProps} {...card.mapBinding} />
 */
export function usePanelMapCard(cardSource: string) {
  const [engine, setEngine] = useState<PanelMapEngine | null>(null);
  const [basemap, setBasemap] = useState<BasemapKind>(DEFAULT_BASEMAP);
  const [geodata, setGeodata] = useState<ReadyGeodata | null>(null);

  // WARNING: o ProtoCard troca o corpo pelo esqueleto ou pelo erro, e o mapa
  // volta a montar no basemap padrão. O `null` do desmonte zera o crédito
  // junto; zerar na chegada do motor perderia uma troca feita antes dele.
  const onEngine = (next: PanelMapEngine | null) => {
    setEngine(next);
    if (!next) setBasemap(DEFAULT_BASEMAP);
  };

  return {
    engine,
    geodata,
    imageSource: panelMapImageSource(cardSource, basemap),
    mapBinding: {
      cooperative: true,
      onEngine,
      onBasemapChange: setBasemap,
      onGeodata: setGeodata,
    },
  };
}
