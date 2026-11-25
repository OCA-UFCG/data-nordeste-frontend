import { act, fireEvent, render, screen } from "@testing-library/react";
import type { FeatureCollection } from "geojson";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdhMapCard } from "@/components/IdhDashboard/IdhMapCard";
import { IDH_CARD_SOURCE } from "@/components/IdhDashboard/idhTheme";
import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapEngineFake } from "@/components/PanelMap/panelMapEngineFake";
import {
  MANIFEST_FIXTURE,
  STYLES_FIXTURE,
} from "@/components/PanelMap/panelMapFixtures";
import type { ReadyGeodata } from "@/components/PanelMap/useGeodata";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import * as chartImage from "@/lib/chartImage";

// O mapa é MapLibre (canvas); o dublê só guarda as props de cada montagem.
const panelMapRenders = vi.hoisted(() => [] as PanelMapProps[]);

vi.mock("@/components/PanelMap/PanelMap", () => ({
  PanelMap: (props: PanelMapProps) => {
    panelMapRenders.push(props);

    return <div data-testid="panel-map" aria-label={props.label} />;
  },
}));

// O jsdom não tem matchMedia; o menu pergunta se a tela é de celular.
const DESKTOP_MEDIA = (query: string) => ({
  matches: false,
  media: query,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
});

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };
const GEODATA: ReadyGeodata = {
  status: "ready",
  styles: STYLES_FIXTURE,
  manifest: MANIFEST_FIXTURE,
  features: EMPTY,
  states: EMPTY,
  areas: EMPTY,
};

// O que o painel dá ao cartaz de download no contexto do menu.
const MENU: ProtoCardMenuContextValue = {
  share: { path: "/demo/idh", chips: [] },
  catalogHref: null,
  imageSource: IDH_CARD_SOURCE,
  poster: {
    panelName: "Painel de Desenvolvimento Social",
    icon: "idh",
    accent: "#7c46e1",
    updatedAt: "11/2026",
    place: "Nordeste",
    chips: ["Ano: 2021", "Área: Nordeste", "Estado: Todos", "Município: Todos"],
  },
};

const lastProps = (): PanelMapProps =>
  panelMapRenders[panelMapRenders.length - 1];

describe("IdhMapCard poster download", () => {
  beforeEach(() => {
    panelMapRenders.length = 0;
    vi.stubGlobal("matchMedia", DESKTOP_MEDIA);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("downloads the poster with the IDH title, subtitle, source and legend", async () => {
    const spy = vi.spyOn(chartImage, "downloadChartImage").mockResolvedValue();

    render(
      <ProtoCardMenuContext.Provider value={MENU}>
        <IdhMapCard
          selection={{ ano: 2021, visao: "geral" }}
          state="ok"
          onRetry={vi.fn()}
          onFiltersChange={vi.fn()}
        />
      </ProtoCardMenuContext.Provider>,
    );
    act(() => {
      lastProps().onEngine?.(new PanelMapEngineFake());
      lastProps().onGeodata?.(GEODATA);
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mais opções: IDH por estado",
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Baixar imagem" }),
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Baixar imagem" }).at(-1)!,
    );

    const poster = spy.mock.calls[0][1].poster;

    expect(poster).toMatchObject({
      title: "Mapa do IDH - Nordeste",
      subtitle: "Nível de desenvolvimento humano - 2021",
      source: IDH_CARD_SOURCE,
    });
    expect(poster?.legend.map((item) => item.label)).toEqual([
      "Até 0,7",
      "> 0,7",
    ]);
  });
});
