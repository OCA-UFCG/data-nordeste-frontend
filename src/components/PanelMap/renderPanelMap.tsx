import { render, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";

import { PanelMap, type PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapEngineFactoryFake } from "@/components/PanelMap/panelMapEngineFake";
import { GeodataFetchFake } from "@/components/PanelMap/panelMapFixtures";
import { EMPTY_RECORTE, type MapRecorte } from "@/features/panelMap/mapRecorte";

/** Props do mapa do PIB em 2023 no Nordeste, com o motor fake da `factory`. */
export function panelMapProps(
  factory: PanelMapEngineFactoryFake,
  overrides: Partial<PanelMapProps>,
): PanelMapProps {
  return {
    indicator: "pib",
    ano: 2023,
    area: "nordeste",
    recorte: EMPTY_RECORTE,
    deepest: "municipio",
    onRecorteChange: vi.fn<(recorte: MapRecorte) => void>(),
    formatValue: (value) => `R$ ${value}`,
    label: "Mapa do PIB por município",
    createEngine: factory.create,
    ...overrides,
  };
}

/**
 * Renderiza o `PanelMap` com geodados e motor fakes e espera o motor receber
 * as fontes. `rerender` troca só as props passadas.
 *
 * @example const { engine, rerender } = await renderPanelMap({ ano: 2022 });
 */
export async function renderPanelMap(overrides: Partial<PanelMapProps> = {}) {
  vi.stubGlobal("fetch", new GeodataFetchFake().fetch);
  const factory = new PanelMapEngineFactoryFake();
  let props = panelMapProps(factory, overrides);
  const view = render(<PanelMap {...props} />);
  const rerender = (next: Partial<PanelMapProps>) => {
    props = { ...props, ...next };
    view.rerender(<PanelMap {...props} />);
  };

  // Pronto = o motor já recebeu as fontes (todos os efeitos do motor rodaram).
  await waitFor(() => expect(factory.engine.setSources).toHaveBeenCalled());

  return { factory, engine: factory.engine, props, view, rerender };
}
