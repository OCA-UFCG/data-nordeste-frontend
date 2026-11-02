import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EChart } from "@/components/EChart/EChart";
import type { ChartOption } from "@/lib/echarts";

type ZrClick = (pointer: { offsetX: number; offsetY: number }) => void;

// Gráfico de mentira: o jsdom não desenha; interessa o que o EChart pede a ele.
class ChartInstanceFake {
  zr = { on: vi.fn(), off: vi.fn() };
  setOption = vi.fn();
  on = vi.fn();
  off = vi.fn();
  resize = vi.fn();
  dispose = vi.fn();
  dispatchAction = vi.fn();
  isDisposed = () => false;
  containPixel = () => true;
  convertFromPixel = () => 2;
  getZr = () => this.zr;
}

let fakeChart: ChartInstanceFake;

vi.mock("@/lib/echarts", () => ({ createChart: () => fakeChart }));

// Entrega uma largura de 400 px assim que o EChart observa o contêiner; o
// teste muda a largura depois (girar o celular, surgir a barra de rolagem).
class ResizeObserverFake {
  static latest: ResizeObserverFake;

  constructor(
    private readonly callback: (
      entries: { contentRect: { width: number } }[],
    ) => void,
  ) {
    ResizeObserverFake.latest = this;
  }

  observe() {
    this.callback([{ contentRect: { width: 400 } }]);
  }

  disconnect() {}

  resizeTo(width: number) {
    act(() => this.callback([{ contentRect: { width } }]));
  }
}

const REDRAW = { notMerge: true };

// O jsdom não tem IntersectionObserver; o teste diz quando o gráfico sai da tela.
class IntersectionObserverFake {
  static latest: IntersectionObserverFake;

  constructor(
    private readonly callback: (entries: { isIntersecting: boolean }[]) => void,
  ) {
    IntersectionObserverFake.latest = this;
  }

  observe() {}

  disconnect() {}

  report(isIntersecting: boolean) {
    this.callback([{ isIntersecting }]);
  }
}

const intersection = {
  report: (visible: boolean) => IntersectionObserverFake.latest.report(visible),
};

const BASE: ChartOption = { series: [{ id: "a", type: "map" }] };
const buildBase = () => BASE;

type ChartProps = Parameters<typeof EChart>[0];

// Sem `option`, usa a opção que depende da largura (a dos outros gráficos).
const renderChart = async (props: Partial<ChartProps>) => {
  const source = props.option ? {} : { buildOption: buildBase };
  const chartProps = { ...source, ...props } as ChartProps;
  const view = render(<EChart {...chartProps} label="Mapa" />);

  await act(async () => {});

  return view;
};

describe("EChart", () => {
  beforeEach(() => {
    fakeChart = new ChartInstanceFake();
    vi.stubGlobal("ResizeObserver", ResizeObserverFake);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverFake);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: Promise.resolve() },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("subscribes the category click once and calls the latest callback", async () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = await renderChart({ onCategoryClick: first });

    rerender(
      <EChart buildOption={buildBase} label="Mapa" onCategoryClick={latest} />,
    );
    const [, handleClick] = fakeChart.zr.on.mock.calls[0] as [string, ZrClick];

    handleClick({ offsetX: 10, offsetY: 10 });

    expect(fakeChart.zr.on).toHaveBeenCalledTimes(1);
    expect(fakeChart.zr.off).not.toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith(2);
  });

  it("subscribes the item click once across renders", async () => {
    const { rerender } = await renderChart({ onItemClick: vi.fn() });

    rerender(
      <EChart buildOption={buildBase} label="Mapa" onItemClick={vi.fn()} />,
    );

    expect(fakeChart.on).toHaveBeenCalledTimes(1);
    expect(fakeChart.off).not.toHaveBeenCalled();
  });

  it("keeps the tooltip while the chart is on screen and hides it when it leaves", async () => {
    await renderChart({});

    intersection.report(true);
    expect(fakeChart.dispatchAction).not.toHaveBeenCalled();

    intersection.report(false);
    expect(fakeChart.dispatchAction).toHaveBeenCalledWith({ type: "hideTip" });
  });

  // O destaque do mapa troca só a cor: nada de notMerge, que desfaz o zoom.
  it("merges a new restyle without redrawing the base option", async () => {
    const restyle = { series: [{ id: "a", data: [1] }] };
    const { rerender } = await renderChart({
      option: BASE,
      morph: false,
      restyleOption: {},
    });

    expect(fakeChart.setOption).toHaveBeenCalledTimes(1);
    fakeChart.setOption.mockClear();
    rerender(
      <EChart
        option={BASE}
        label="Mapa"
        morph={false}
        restyleOption={restyle}
      />,
    );

    expect(fakeChart.setOption).toHaveBeenCalledExactlyOnceWith(restyle);
  });

  // Sem isso o mapa pinta ~1.800 municípios no cinza e só depois as faixas.
  it("redraws with the current colors in the same call", async () => {
    const restyle = {
      tooltip: { trigger: "item" },
      series: [{ id: "a", data: [7] }],
    };

    await renderChart({ option: BASE, morph: false, restyleOption: restyle });

    expect(fakeChart.setOption).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        tooltip: { trigger: "item" },
        series: [{ id: "a", type: "map", data: [7] }],
      }),
      REDRAW,
    );
  });

  it("does not spread a restyle over series without id", async () => {
    const base: ChartOption = {
      series: [
        { type: "pie", data: [1] },
        { type: "pie", data: [2] },
      ],
    };

    await renderChart({
      option: base,
      morph: false,
      restyleOption: { series: [{ data: [9] }] },
    });

    expect(fakeChart.setOption).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ series: base.series }),
      REDRAW,
    );
  });

  // Girar o celular desfaria o zoom do mapa; o resize() já ajusta o tamanho.
  it("keeps a width-independent option when the width changes", async () => {
    await renderChart({ option: BASE, morph: false });
    fakeChart.setOption.mockClear();
    ResizeObserverFake.latest.resizeTo(800);

    expect(fakeChart.resize).toHaveBeenCalled();
    expect(fakeChart.setOption).not.toHaveBeenCalled();
  });

  it("rebuilds a width-dependent option when the width changes", async () => {
    const buildOption = vi.fn((): ChartOption => ({ ...BASE }));

    await renderChart({ buildOption });
    ResizeObserverFake.latest.resizeTo(800);

    expect(buildOption).toHaveBeenLastCalledWith(800);
    expect(fakeChart.setOption).toHaveBeenCalledTimes(2);
  });
});
