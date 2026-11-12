"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  IdhSkeleton,
  type IdhCardState,
} from "@/components/IdhDashboard/IdhCard";
import { IdhIcon, type IdhIconName } from "@/components/IdhDashboard/IdhIcon";
import { CARD_SHADOW, FOCUS_RING } from "@/components/IdhDashboard/idhStyles";
import { describeIdhClass } from "@/features/panels/idh/idhClasses";
import { formatIdhCard, formatRenda } from "@/features/panels/idh/idhFormat";
import type {
  IdhPanelData,
  IdhYearPoint,
} from "@/features/panels/idh/idhPanel";

type BigNumber = {
  icon: IdhIconName;
  label: string;
  value: string | null;
  caption?: string;
};

const bigNumbers = (data: IdhPanelData): BigNumber[] => {
  const point = data.serie.find((item) => item.ano === data.filters.ano);
  const show = (format: (value: number) => string, key: keyof IdhYearPoint) =>
    point ? format(point[key]) : null;

  return [
    {
      icon: "idh",
      label: "IDH",
      value: show(formatIdhCard, "idh"),
      caption: describeIdhClass(data),
    },
    {
      icon: "idhad",
      label: "IDH ajustado à desigualdade",
      value: show(formatIdhCard, "idhAjustado"),
    },
    {
      icon: "gini",
      label: "Índice de Gini",
      value: show(formatIdhCard, "gini"),
    },
    {
      icon: "renda",
      label: "Renda domiciliar per capita",
      value: show(formatRenda, "rendaPerCapita"),
    },
    {
      icon: "rend",
      label: "Rendimento médio dos ocupados",
      value: show(formatRenda, "rendimento"),
    },
  ];
};

const CELL_CLASS = `flex min-h-[118px] min-w-0 flex-col rounded-[8px] border border-grey-300 bg-white p-4 ${CARD_SHADOW} max-[1099px]:flex-[0_0_calc((100%-24px)/3)] max-[1099px]:snap-start max-[700px]:flex-[0_0_100%]`;

const CellTop = ({ icon, label }: { icon: IdhIconName; label: string }) => (
  <div className="flex min-h-[34px] items-center gap-2.5">
    <span className="grid size-8 flex-none place-items-center rounded-[8px] bg-[#f6f4fe] text-[#6d34cd]">
      <IdhIcon name={icon} size={20} />
    </span>
    <div className="min-w-0 text-[13px] leading-[17px] font-medium">
      {label}
    </div>
  </div>
);

const VALUE_CLASS =
  "mt-auto pt-2.5 text-[28px] leading-[34px] font-bold tracking-[-0.01em] whitespace-nowrap tabular-nums";

const Cell = ({
  cell,
  state,
  onRetry,
}: {
  cell: BigNumber;
  state: IdhCardState;
  onRetry: () => void;
}) => {
  if (state === "loading") {
    return (
      <div aria-busy="true" className={CELL_CLASS}>
        <div className="flex min-h-[34px] items-center gap-2.5">
          <IdhSkeleton className="size-8" />
          <IdhSkeleton className="h-3.5 w-[60%]" />
        </div>
        <IdhSkeleton className="mt-auto h-7 w-[70%]" />
      </div>
    );
  }

  return (
    <div className={CELL_CLASS}>
      <CellTop icon={cell.icon} label={cell.label} />
      {state === "error" ? (
        <div className="mt-auto pt-2.5 text-sm leading-5 font-medium">
          Não foi possível carregar.{" "}
          <button
            type="button"
            onClick={onRetry}
            className="py-1.5 text-sm font-semibold text-green-900 underline underline-offset-3"
          >
            Tentar de novo
          </button>
        </div>
      ) : (
        <>
          <div
            className={`${VALUE_CLASS} ${cell.value ? "" : "text-[#b7b3b5]"}`}
          >
            {cell.value ?? "—"}
          </div>
          {cell.value === null ? (
            <div className="mt-0.5 text-[11.5px] leading-[14px] text-grey-800">
              sem dado neste ano
            </div>
          ) : null}
          {cell.value && cell.caption ? (
            <div className="mt-0.5 text-[11.5px] leading-[14px] text-grey-800">
              {cell.caption}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

type CarouselState = {
  overflow: boolean;
  index: number;
  canPrev: boolean;
  canNext: boolean;
};

// Abaixo de 1100 px os cards rolam de lado; as setas e bolinhas só aparecem
// quando há o que rolar.
const useCarousel = (ref: RefObject<HTMLDivElement | null>) => {
  const [state, setState] = useState<CarouselState>({
    overflow: false,
    index: 0,
    canPrev: false,
    canNext: false,
  });
  const update = useCallback(() => {
    const element = ref.current;
    const first = element?.children[0] as HTMLElement | undefined;

    if (!element || !first) return;
    const step = first.offsetWidth + 12;

    setState({
      overflow: element.scrollWidth > element.clientWidth + 2,
      index: Math.min(
        element.children.length - 1,
        Math.round(element.scrollLeft / step),
      ),
      canPrev: element.scrollLeft > 2,
      canNext:
        element.scrollLeft + element.clientWidth < element.scrollWidth - 2,
    });
  }, [ref]);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;
    const observer = new ResizeObserver(update);

    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });

    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [ref, update]);

  return state;
};

const ARROW_CLASS = `grid size-8 place-items-center rounded-[6px] bg-green-800 p-0 text-white disabled:cursor-default disabled:bg-[#9ed3b2] ${FOCUS_RING}`;

const CarouselControls = ({
  count,
  carousel,
  onStep,
}: {
  count: number;
  carousel: CarouselState;
  onStep: (direction: -1 | 1) => void;
}) => (
  <div className="mt-3 flex items-center justify-center gap-6">
    <button
      type="button"
      aria-label="Indicador anterior"
      disabled={!carousel.canPrev}
      onClick={() => onStep(-1)}
      className={ARROW_CLASS}
    >
      <IdhIcon name="back" size={16} stroke={2.6} />
    </button>
    <div aria-hidden="true" className="flex gap-2">
      {Array.from({ length: count }, (_, index) => (
        <i
          key={index}
          className={`size-2 rounded-full transition-colors duration-200 ${index === carousel.index ? "bg-green-1000" : "bg-grey-300"}`}
        />
      ))}
    </div>
    <button
      type="button"
      aria-label="Próximo indicador"
      disabled={!carousel.canNext}
      onClick={() => onStep(1)}
      className={ARROW_CLASS}
    >
      <IdhIcon name="forward" size={16} stroke={2.6} />
    </button>
  </div>
);

/**
 * Indicadores do topo da visão geral (`.bns` do protótipo): cinco cards em
 * grade; abaixo de 1100 px, um carrossel com setas e bolinhas.
 *
 * @example <IdhBigNumbers data={panel} state="ok" onRetry={retry} />
 */
export const IdhBigNumbers = ({
  data,
  state,
  onRetry,
}: {
  data: IdhPanelData;
  state: IdhCardState;
  onRetry: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const carousel = useCarousel(ref);
  const cells = bigNumbers(data);
  const step = (direction: -1 | 1) => {
    const first = ref.current?.children[0] as HTMLElement | undefined;

    ref.current?.scrollBy({
      left: direction * ((first?.offsetWidth ?? 0) + 12),
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="grid grid-cols-5 gap-4 max-[1099px]:-m-0.5 max-[1099px]:flex max-[1099px]:snap-x max-[1099px]:snap-mandatory max-[1099px]:gap-3 max-[1099px]:overflow-x-auto max-[1099px]:p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cells.map((cell) => (
          <Cell key={cell.label} cell={cell} state={state} onRetry={onRetry} />
        ))}
      </div>
      {carousel.overflow ? (
        <CarouselControls
          count={cells.length}
          carousel={carousel}
          onStep={step}
        />
      ) : null}
    </div>
  );
};
