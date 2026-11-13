"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type ProtoCardState,
  ProtoSkeleton,
} from "@/components/ProtoPanel/ProtoCard";
import {
  ProtoIcon,
  type ProtoIconName,
} from "@/components/ProtoPanel/ProtoIcon";
import { CARD_SHADOW, FOCUS_RING } from "@/components/ProtoPanel/protoStyles";

// Variação do mesmo número: a seta verde ou vermelha ao lado da variação.
export type ProtoStatPill = {
  text: string;
  direction: "up" | "down" | "flat";
};

export type ProtoStatCell = {
  icon: ProtoIconName;
  label: string;
  value: string | null;
  caption?: string;
  pill?: ProtoStatPill | null;
};

// `hero`: o número de destaque do perfil demográfico, em card único e maior.
const CELL_BASE = `flex min-w-0 flex-col rounded-[8px] border border-grey-300 bg-white p-4 ${CARD_SHADOW}`;
const ROW_CELL_CLASS = `${CELL_BASE} min-h-[118px] max-[1099px]:flex-[0_0_calc((100%-24px)/3)] max-[1099px]:snap-start max-[700px]:flex-[0_0_100%]`;
const HERO_CELL_CLASS = `${CELL_BASE} min-h-[132px]`;

const cellClass = (hero: boolean) => (hero ? HERO_CELL_CLASS : ROW_CELL_CLASS);

// Cor do ícone do card: o IDH usa o tom do painel; o perfil passa a sua.
const DEFAULT_ICON_CLASS =
  "bg-(--proto-accent-soft) text-(--proto-accent-strong)";

const CellTop = ({
  icon,
  label,
  iconClassName,
}: {
  icon: ProtoIconName;
  label: string;
  iconClassName: string;
}) => (
  <div className="flex min-h-[34px] items-center gap-2.5">
    <span
      className={`grid size-8 flex-none place-items-center rounded-[8px] ${iconClassName}`}
    >
      <ProtoIcon name={icon} size={20} />
    </span>
    <div className="min-w-0 text-[13px] leading-[17px] font-medium">
      {label}
    </div>
  </div>
);

const VALUE_CLASS =
  "mt-auto pt-2.5 text-[28px] leading-[34px] font-bold tracking-[-0.01em] whitespace-nowrap tabular-nums";

const HERO_VALUE_CLASS =
  "mt-auto pt-2.5 text-[30px] leading-9 font-bold tracking-[-0.01em] whitespace-nowrap tabular-nums";

// Verde para alta, vermelho para queda e cinza sem variação, como no protótipo.
const PILL_CLASS = {
  up: "bg-[#e3f7ea] text-[#085f2d]",
  down: "bg-[#ffe1e3] text-[#8f0f18]",
  flat: "bg-grey-200 text-grey-1000",
} as const;

const Pill = ({ pill }: { pill: ProtoStatPill }) => (
  <span
    className={`mt-2 inline-flex items-center gap-1 self-start rounded-full px-[9px] py-0.5 text-[11.5px] leading-4 font-bold ${PILL_CLASS[pill.direction]}`}
  >
    {pill.direction === "flat" ? null : (
      <ProtoIcon
        name="up"
        size={12}
        stroke={2.6}
        className={pill.direction === "down" ? "rotate-90" : ""}
      />
    )}
    {pill.text}
  </span>
);

const CellLoading = ({ hero }: { hero: boolean }) => (
  <div aria-busy="true" className={cellClass(hero)}>
    <div className="flex min-h-[34px] items-center gap-2.5">
      <ProtoSkeleton className="size-8" />
      <ProtoSkeleton className="h-3.5 w-[60%]" />
    </div>
    <ProtoSkeleton className="mt-auto h-7 w-[70%]" />
  </div>
);

const CellError = ({
  cell,
  onRetry,
  hero,
  iconClassName,
}: {
  cell: ProtoStatCell;
  onRetry: () => void;
  hero: boolean;
  iconClassName: string;
}) => (
  <div className={cellClass(hero)}>
    <CellTop
      icon={cell.icon}
      label={cell.label}
      iconClassName={iconClassName}
    />
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
  </div>
);

const CellValue = ({ cell, hero }: { cell: ProtoStatCell; hero: boolean }) => (
  <>
    <div
      className={`${hero ? HERO_VALUE_CLASS : VALUE_CLASS} ${cell.value ? "" : "text-[#b7b3b5]"}`}
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
    {cell.value && cell.pill ? <Pill pill={cell.pill} /> : null}
  </>
);

const Cell = ({
  cell,
  state,
  onRetry,
  hero,
  iconClassName,
}: {
  cell: ProtoStatCell;
  state: ProtoCardState;
  onRetry: () => void;
  hero: boolean;
  iconClassName: string;
}) => {
  if (state === "loading") return <CellLoading hero={hero} />;
  if (state === "error")
    return (
      <CellError
        cell={cell}
        onRetry={onRetry}
        hero={hero}
        iconClassName={iconClassName}
      />
    );

  return (
    <div className={cellClass(hero)}>
      <CellTop
        icon={cell.icon}
        label={cell.label}
        iconClassName={iconClassName}
      />
      <CellValue cell={cell} hero={hero} />
    </div>
  );
};

export type ProtoCarouselState = {
  overflow: boolean;
  index: number;
  canPrev: boolean;
  canNext: boolean;
};

// Abaixo de 1100 px os cards rolam de lado; as setas e bolinhas só aparecem
// quando há o que rolar.
export const useProtoCarousel = (ref: RefObject<HTMLDivElement | null>) => {
  const [state, setState] = useState<ProtoCarouselState>({
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
  carousel: ProtoCarouselState;
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
      <ProtoIcon name="back" size={16} stroke={2.6} />
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
      <ProtoIcon name="forward" size={16} stroke={2.6} />
    </button>
  </div>
);

/**
 * Faixa de indicadores (`.bns` do protótipo): cards em grade; abaixo de
 * 1100 px, um carrossel com setas e bolinhas. Os textos e os valores vêm
 * prontos em `cells`. `variant="hero"`: um card só, sem carrossel (o número
 * de destaque do perfil). `iconClassName`: cor do chip do ícone (padrão: o
 * tom do painel).
 *
 * @example <ProtoStatCards cells={[{ icon: "idh", label: "IDH", value: "0,702" }]} state="ok" onRetry={retry} />
 */
export const ProtoStatCards = ({
  cells,
  state,
  onRetry,
  variant = "row",
  iconClassName = DEFAULT_ICON_CLASS,
}: {
  cells: ProtoStatCell[];
  state: ProtoCardState;
  onRetry: () => void;
  variant?: "row" | "hero";
  iconClassName?: string;
}) => {
  const hero = variant === "hero";
  const ref = useRef<HTMLDivElement>(null);
  const carousel = useProtoCarousel(ref);
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
        className={
          hero
            ? "grid grid-cols-1"
            : "grid grid-cols-5 gap-4 max-[1099px]:-m-0.5 max-[1099px]:flex max-[1099px]:snap-x max-[1099px]:snap-mandatory max-[1099px]:gap-3 max-[1099px]:overflow-x-auto max-[1099px]:p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        {cells.map((cell) => (
          <Cell
            key={cell.label}
            cell={cell}
            state={state}
            onRetry={onRetry}
            hero={hero}
            iconClassName={iconClassName}
          />
        ))}
      </div>
      {carousel.overflow && !hero ? (
        <CarouselControls
          count={cells.length}
          carousel={carousel}
          onStep={step}
        />
      ) : null}
    </div>
  );
};
