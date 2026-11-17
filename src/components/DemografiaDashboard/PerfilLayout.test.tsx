import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PerfilEmptyLayout,
  PerfilGrids,
} from "@/components/DemografiaDashboard/PerfilLayout";
import type { PerfilLayoutProps } from "@/components/DemografiaDashboard/PerfilLayout";
import {
  usePorteMapView,
  type PorteMapView,
} from "@/components/DemografiaDashboard/PerfilPorteMapCard";
import {
  emptyDemografiaPanel,
  DEMOGRAFIA_YEAR_RANGE,
} from "@/features/panels/demografia/demografiaPanel";
import { resolvePerfilCardStates } from "@/features/panels/demografia/perfilCardState";
import { defaultTerritorialFilters } from "@/features/panels/territorialFilters";

// O mapa de porte tem canvas e busca a malha; o teste só precisa do layout e
// da vista do mapa, que o dublê mostra e troca.
vi.mock(
  "@/components/DemografiaDashboard/PerfilPorteMapCard",
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    PerfilPorteMapCard: ({ mapView }: { mapView: PorteMapView }) => (
      <button type="button" onClick={() => mapView.setView("estados")}>
        {`vista ${mapView.view}`}
      </button>
    ),
  }),
);

const FILTERS = defaultTerritorialFilters(DEMOGRAFIA_YEAR_RANGE);

const buildProps = (
  onReset: () => void,
  mapView: PorteMapView,
): PerfilLayoutProps => ({
  data: emptyDemografiaPanel(FILTERS),
  place: "Nordeste",
  states: resolvePerfilCardStates(
    { failed: false, retrying: false, pending: null },
    FILTERS,
  ),
  selection: FILTERS,
  mapView,
  onRetry: () => undefined,
  onSelectUf: () => undefined,
  onReset,
});

const LayoutHarness = ({
  empty,
  onReset = () => undefined,
}: {
  empty: boolean;
  onReset?: () => void;
}) => {
  const props = buildProps(onReset, usePorteMapView());

  return empty ? <PerfilEmptyLayout {...props} /> : <PerfilGrids {...props} />;
};

describe("PerfilEmptyLayout", () => {
  it("shows one shortcut back to the default place and year", () => {
    render(<LayoutHarness empty />);

    const buttons = screen.getAllByRole("button", { name: /^Ver / });

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent("Ver Nordeste");
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).toBeNull();
  });

  it("calls onReset when the shortcut is clicked", () => {
    const onReset = vi.fn();
    render(<LayoutHarness empty onReset={onReset} />);

    fireEvent.click(screen.getByRole("button", { name: /Ver Nordeste/ }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

// O jsdom não tem matchMedia nem ResizeObserver; os outros cards da grade usam
// os dois (o ⓘ pergunta se é celular, os gráficos medem a largura).
const matchMediaFake = (query: string) => ({
  matches: false,
  media: query,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
});

class ResizeObserverFake {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("PerfilGrids and PerfilEmptyLayout", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", matchMediaFake);
    vi.stubGlobal("ResizeObserver", ResizeObserverFake);
  });
  afterEach(() => vi.unstubAllGlobals());

  // Regressão (revisão da PR #400): a troca de layout montava o card de novo,
  // e a vista escolhida voltava para Municípios.
  it("keeps the map view when switching to the empty layout", () => {
    const { rerender } = render(<LayoutHarness empty={false} />);

    fireEvent.click(screen.getByRole("button", { name: "vista municipios" }));
    rerender(<LayoutHarness empty />);

    expect(screen.getByRole("button", { name: "vista estados" })).toBeTruthy();
  });
});
