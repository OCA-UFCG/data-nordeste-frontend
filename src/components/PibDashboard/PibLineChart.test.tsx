import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PIB_LINE_HEIGHT_CLASS,
  PibLineChart,
} from "@/components/PibDashboard/PibLineChart";
import {
  buildPibLineGeometry,
  PIB_LINE_HEIGHT,
  PIB_LINE_NARROW_WIDTH,
} from "@/features/panels/pib/pibLineChart";

const SERIE = [
  { ano: 2022, pib: 1e9, perCapita: 1e4 },
  { ano: 2023, pib: 1.1e9, perCapita: 1.1e4 },
];

const heightAt = (width: number) =>
  buildPibLineGeometry({ width, serie: SERIE, key: "pib", selectedIndex: 1 })
    .height;

describe("PIB_LINE_HEIGHT_CLASS", () => {
  it("matches the SVG frame height on both sides of the narrow width", () => {
    expect(PIB_LINE_HEIGHT_CLASS).toBe(
      `min-h-[${PIB_LINE_HEIGHT.narrow}px] @[${PIB_LINE_NARROW_WIDTH}px]:min-h-[${PIB_LINE_HEIGHT.wide}px]`,
    );
    expect(heightAt(PIB_LINE_NARROW_WIDTH - 1)).toBe(PIB_LINE_HEIGHT.narrow);
    expect(heightAt(PIB_LINE_NARROW_WIDTH)).toBe(PIB_LINE_HEIGHT.wide);
  });
});

// jsdom não mede nada: o observador avisa na hora, e clientWidth (abaixo)
// devolve a largura do gráfico num card de celular.
class ResizeObserverMobileFake {
  constructor(private readonly notify: () => void) {}

  observe() {
    this.notify();
  }

  unobserve() {}

  disconnect() {}
}

const NORDESTE = [
  { ano: 2022, pib: 1.388e12, perCapita: 25401 },
  { ano: 2023, pib: 1.513e12, perCapita: 27682 },
];

const chartSvg = (name: RegExp) => within(screen.getByRole("group", { name }));

describe("PibLineChart", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMobileFake);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(306);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("draws only the total, with its unit above a plain axis", () => {
    render(
      <PibLineChart
        seriesKey="pib"
        serie={NORDESTE}
        ano={2023}
        onSelectYear={vi.fn()}
      />,
    );
    const svg = chartSvg(/^Dinâmica temporal do PIB total, 2022 a 2023$/);

    expect(svg.getByText("R$ bilhões")).toBeTruthy();
    expect(svg.getByText("1.600")).toBeTruthy();
    expect(svg.getByText("R$ 1,51 Tri")).toBeTruthy();
    expect(svg.queryByText("R$ 27,68 Mil")).toBeNull();
  });

  it("draws only the per capita, in thousands", () => {
    render(
      <PibLineChart
        seriesKey="perCapita"
        serie={NORDESTE}
        ano={2023}
        onSelectYear={vi.fn()}
      />,
    );
    const svg = chartSvg(/^Dinâmica temporal do PIB per capita, /);

    expect(svg.getByText("R$ mil")).toBeTruthy();
    expect(svg.getByText("R$ 27,68 Mil")).toBeTruthy();
    expect(svg.queryByText("R$ 1,51 Tri")).toBeNull();
  });
});
