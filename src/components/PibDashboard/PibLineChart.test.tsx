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
  buildPibLineGeometry({ width, serie: SERIE, selectedIndex: 1 }).height;

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

const chartSvg = () =>
  within(
    screen.getByRole("group", {
      name: /^Dinâmica temporal do PIB total e do PIB per capita/,
    }),
  );

describe("PibLineChart", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMobileFake);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(306);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("names each axis with its unit and writes plain ticks in it", () => {
    render(<PibLineChart serie={NORDESTE} ano={2023} onSelectYear={vi.fn()} />);
    const svg = chartSvg();

    expect(svg.getByText("PIB total (R$ bilhões)")).toBeTruthy();
    expect(svg.getByText("PIB per capita (R$ mil)")).toBeTruthy();
    expect(svg.getByText("1.600")).toBeTruthy();
    expect(svg.getByText("40")).toBeTruthy();
    expect(svg.queryAllByText(/^R\$ [\d.,]+ (Bi|Tri|Mil)$/)).toHaveLength(2);
  });

  // Os títulos dos eixos já nomeiam as séries.
  it("shows no series legend", () => {
    render(<PibLineChart serie={NORDESTE} ano={2023} onSelectYear={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /PIB total/ })).toBeNull();
  });
});
