"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  createChart,
  type ChartInstance,
  type ChartOption,
  type ChartRenderer,
} from "@/lib/echarts";

// Uma das duas fontes da opção base. `option` é a que não depende da largura
// (o mapa): mudar o tamanho só chama resize(), sem redesenhar nem desfazer o zoom.
type EChartSource =
  | { buildOption: (width: number) => ChartOption; option?: never }
  | { option: ChartOption; buildOption?: never };

type EChartProps = EChartSource & {
  label: string;
  className?: string;
  style?: CSSProperties;
  onItemClick?: (name: string) => void;

  // Clique em qualquer ponto da área do grid: recebe o índice da categoria.
  onCategoryClick?: (index: number) => void;

  onCategoryHover?: (index: number | null) => void;
  renderer?: ChartRenderer;

  // false: cada opção nova redesenha do zero (o mapa, que não pode herdar o
  // zoom e o enquadramento da opção anterior).
  morph?: boolean;

  // Merge sobre a base, e junto dela em cada redesenho (o mapa não pisca no
  // cinza): trocar só a cor (destaque do mapa) não redesenha nem desfaz o zoom.
  restyleOption?: ChartOption;
};

// Séries e legenda casam pelo id: as que ficam se transformam (barras crescem,
// a linha muda de forma) e as que saíram somem. notMerge mataria a animação.
const MORPH_UPDATE = { replaceMerge: ["series", "legend"] };
const REDRAW_UPDATE = { notMerge: true };

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const WIDTH_STEP = 40;

const useChartInstance = (renderer?: ChartRenderer) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;
    const instance = createChart(element, renderer);
    const observer = new ResizeObserver(([entry]) => {
      instance.resize();
      setWidth(Math.round(entry.contentRect.width / WIDTH_STEP) * WIDTH_STEP);
    });

    observer.observe(element);
    setChart(instance);

    return () => {
      observer.disconnect();
      instance.dispose();
    };
  }, [renderer]);

  return { containerRef, chart, width };
};

const usePageFont = (containerRef: RefObject<HTMLDivElement | null>) => {
  const [fontFamily, setFontFamily] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    document.fonts.ready.then(() => {
      const element = containerRef.current;

      if (active && element) {
        setFontFamily(getComputedStyle(element).fontFamily);
      }
    });

    return () => {
      active = false;
    };
  }, [containerRef]);

  return fontFamily;
};

// Guarda o callback mais recente sem reassinar o evento: quem passa uma arrow
// nova a cada render não faz o gráfico desligar e religar o clique toda vez.
const useLatest = <Value,>(value: Value) => {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
};

type ZrPointer = { offsetX: number; offsetY: number };

// O alvo deixa de ser só a bolinha (8 px, pequena para o dedo) e passa a ser a
// coluna inteira da categoria. Fora do grid (eixos, margens) não faz nada.
const useCategoryClick = (
  chart: ChartInstance | null,
  onCategoryClick?: (index: number) => void,
) => {
  const latest = useLatest(onCategoryClick);

  useEffect(() => {
    if (!chart) return;
    const zr = chart.getZr();
    const handleGridClick = ({ offsetX, offsetY }: ZrPointer) => {
      if (!latest.current) return;
      if (!chart.containPixel({ gridIndex: 0 }, [offsetX, offsetY])) return;
      latest.current(chart.convertFromPixel({ xAxisIndex: 0 }, offsetX));
    };

    zr.on("click", handleGridClick);

    return () => {
      zr.off("click", handleGridClick);
    };
  }, [chart, latest]);
};

type AxisPointerEvent = { axesInfo?: { value: unknown }[] };

// Pelo ponteiro do eixo (trigger "axis"), que o toque também move.
const useCategoryHover = (
  chart: ChartInstance | null,
  onCategoryHover?: (index: number | null) => void,
) => {
  const latest = useLatest(onCategoryHover);

  useEffect(() => {
    if (!chart) return;
    const handlePointer = (event: unknown) => {
      const index = (event as AxisPointerEvent).axesInfo?.[0]?.value;

      latest.current?.(typeof index === "number" ? index : null);
    };
    const handleOut = () => latest.current?.(null);

    chart.on("updateAxisPointer", handlePointer);
    chart.on("globalout", handleOut);

    return () => {
      if (chart.isDisposed()) return;
      chart.off("updateAxisPointer", handlePointer);
      chart.off("globalout", handleOut);
    };
  }, [chart, latest]);
};

const useItemClick = (
  chart: ChartInstance | null,
  onItemClick?: (name: string) => void,
) => {
  const latest = useLatest(onItemClick);

  useEffect(() => {
    if (!chart) return;
    const handleClick = (params: { name?: string }) => {
      if (params.name) latest.current?.(params.name);
    };

    chart.on("click", handleClick);

    // Ao desmontar, o efeito de useChartInstance (declarado antes) já fez o
    // dispose; chamar off num gráfico descartado só gera aviso do ECharts.
    return () => {
      if (!chart.isDisposed()) chart.off("click", handleClick);
    };
  }, [chart, latest]);
};

// No toque não há "mouse saiu": o balão aberto por um toque fica aberto na
// rolagem e só fecha quando o gráfico inteiro sai da tela.
const useHideTooltipOffscreen = (
  chart: ChartInstance | null,
  containerRef: RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    const element = containerRef.current;

    if (!chart || !element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !chart.isDisposed()) {
        chart.dispatchAction({ type: "hideTip" });
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [chart, containerRef]);
};

type ChartOptionsProps = {
  buildOption?: (width: number) => ChartOption;
  option?: ChartOption;
  morph?: boolean;
  restyleOption?: ChartOption;
};

type ChartSeries = { id?: string | number };

const seriesOf = (option: ChartOption): ChartSeries[] =>
  [option.series ?? []].flat();

const isPlainObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Componentes de topo (o geo do mapa em camadas) se mesclam como no setOption;
// substituídos, perderiam o `map` e o quadro.
const mergeComponents = (base: ChartOption, restyle: ChartOption) =>
  Object.fromEntries(
    Object.entries(restyle).map(([key, value]) => {
      const original = base[key];

      return [
        key,
        isPlainObject(value) && isPlainObject(original)
          ? { ...original, ...value }
          : value,
      ];
    }),
  );

// Junta o restyle à base numa chamada só, casando as séries pelo id.
const withRestyle = (base: ChartOption, restyle?: ChartOption): ChartOption => {
  if (!restyle) return base;
  const restyleSeries = seriesOf(restyle);
  const series = seriesOf(base).map((item) => ({
    ...item,

    // Só casa por id definido: undefined === undefined espalharia uma série
    // do restyle sobre todas as séries sem id.
    ...(item.id === undefined
      ? {}
      : restyleSeries.find((restyled) => restyled.id === item.id)),
  }));

  return { ...base, ...mergeComponents(base, restyle), series };
};

const useBaseOption = (
  width: number,
  { buildOption, option }: ChartOptionsProps,
) =>
  useMemo(() => {
    if (width === 0) return null;

    return buildOption ? buildOption(width) : option ?? null;
  }, [width, buildOption, option]);

type ChartUpdate = {
  chart: ChartInstance | null;
  base: ChartOption | null;
  fontFamily: string | null;

  // O último restyle aplicado: o efeito do restyle não repete o que o
  // redesenho acabou de levar.
  appliedRef: { current: ChartOption | undefined };
};

const useBaseRedraw = (
  { chart, base, fontFamily, appliedRef }: ChartUpdate,
  morph: boolean,
  restyleOption?: ChartOption,
) => {
  const latestRestyle = useLatest(restyleOption);

  useEffect(() => {
    if (!chart || !base || !fontFamily) return;
    const textStyle = { ...(base.textStyle as object), fontFamily };
    const motion = prefersReducedMotion() ? { animation: false } : {};
    const option = { ...base, textStyle, ...motion };

    appliedRef.current = latestRestyle.current;
    chart.setOption(
      withRestyle(option, appliedRef.current),
      morph ? MORPH_UPDATE : REDRAW_UPDATE,
    );
  }, [chart, base, fontFamily, morph, appliedRef, latestRestyle]);
};

const useRestyleMerge = (
  { chart, base, fontFamily, appliedRef }: ChartUpdate,
  restyleOption?: ChartOption,
) => {
  useEffect(() => {
    if (!chart || !base || !fontFamily || !restyleOption) return;
    if (appliedRef.current === restyleOption) return;
    appliedRef.current = restyleOption;
    chart.setOption(restyleOption);
  }, [chart, base, fontFamily, appliedRef, restyleOption]);
};

const useChartOptions = (
  chart: ChartInstance | null,
  width: number,
  fontFamily: string | null,
  props: ChartOptionsProps,
) => {
  const base = useBaseOption(width, props);
  const appliedRef = useRef<ChartOption | undefined>(undefined);
  const update = { chart, base, fontFamily, appliedRef };

  // Nesta ordem: na mesma renderização, o redesenho leva o restyle novo e o
  // merge vê que ele já foi aplicado.
  useBaseRedraw(update, props.morph ?? true, props.restyleOption);
  useRestyleMerge(update, props.restyleOption);
};

export const EChart = ({
  buildOption,
  option,
  label,
  className,
  style,
  onItemClick,
  onCategoryClick,
  onCategoryHover,
  renderer,
  morph,
  restyleOption,
}: EChartProps) => {
  const { containerRef, chart, width } = useChartInstance(renderer);
  const fontFamily = usePageFont(containerRef);

  useChartOptions(chart, width, fontFamily, {
    buildOption,
    option,
    morph,
    restyleOption,
  });
  useItemClick(chart, onItemClick);
  useCategoryClick(chart, onCategoryClick);
  useCategoryHover(chart, onCategoryHover);
  useHideTooltipOffscreen(chart, containerRef);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      role="img"
      aria-label={label}
    />
  );
};
