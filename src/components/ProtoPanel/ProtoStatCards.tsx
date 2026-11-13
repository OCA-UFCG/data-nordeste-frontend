"use client";

import { useEffect, useState } from "react";
import {
  type ProtoCardState,
  ProtoSkeleton,
} from "@/components/ProtoPanel/ProtoCard";
import {
  ProtoIcon,
  type ProtoIconName,
} from "@/components/ProtoPanel/ProtoIcon";
import {
  CARD_SHADOW,
  FOCUS_RING,
  staleClass,
} from "@/components/ProtoPanel/protoStyles";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel";

export type ProtoStatCell = {
  icon: ProtoIconName;
  label: string;
  value: string | null;
  caption?: string;
};

const CELL_CLASS = `flex h-full min-h-[118px] min-w-0 flex-col rounded-[8px] border border-grey-300 bg-white p-4 ${CARD_SHADOW}`;

const CellTop = ({ icon, label }: { icon: ProtoIconName; label: string }) => (
  <div className="flex min-h-[34px] items-center gap-2.5">
    <span className="grid size-8 flex-none place-items-center rounded-[8px] bg-(--proto-accent-soft) text-(--proto-accent-strong)">
      <ProtoIcon name={icon} size={20} />
    </span>
    <div className="min-w-0 text-[13px] leading-[17px] font-medium">
      {label}
    </div>
  </div>
);

const VALUE_CLASS =
  "mt-auto pt-2.5 text-[28px] leading-[34px] font-bold tracking-[-0.01em] whitespace-nowrap tabular-nums";

const CellLoading = () => (
  <div aria-busy="true" className={CELL_CLASS}>
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
}: {
  cell: ProtoStatCell;
  onRetry: () => void;
}) => (
  <div className={CELL_CLASS}>
    <CellTop icon={cell.icon} label={cell.label} />
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

const CellValue = ({ cell }: { cell: ProtoStatCell }) => (
  <>
    <div className={`${VALUE_CLASS} ${cell.value ? "" : "text-[#b7b3b5]"}`}>
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
);

const Cell = ({
  cell,
  state,
  onRetry,
}: {
  cell: ProtoStatCell;
  state: ProtoCardState;
  onRetry: () => void;
}) => {
  if (state === "loading") return <CellLoading />;
  if (state === "error") return <CellError cell={cell} onRetry={onRetry} />;

  return (
    <div
      aria-busy={state === "stale"}
      className={`${CELL_CLASS} ${staleClass(state === "stale")}`}
    >
      <CellTop icon={cell.icon} label={cell.label} />
      <CellValue cell={cell} />
    </div>
  );
};

// Do 1100 px em diante o embla desliga e os cards viram a grade de cinco.
const CAROUSEL_OPTIONS = {
  align: "start",
  breakpoints: { "(min-width: 1100px)": { active: false } },
} as const;

// Espaço entre os cards: no carrossel é o padding do item (o embla mede os
// slides, não o `gap`), por isso o passo acompanha a classe sem número fixo.
const TRACK_CLASS =
  "-ml-3 min-[1100px]:ml-0 min-[1100px]:grid min-[1100px]:grid-cols-5 min-[1100px]:gap-4";
const ITEM_CLASS =
  "basis-1/3 pl-3 max-[700px]:basis-full min-[1100px]:basis-auto min-[1100px]:pl-0";

// Quantas paradas o carrossel tem: três cards por vez no tablet dão três
// paradas, não cinco. Muda quando a largura troca de faixa.
const useSnapCount = () => {
  const { api } = useCarousel();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setCount(api.scrollSnapList().length);

    update();
    api.on("reInit", update);

    return () => {
      api.off("reInit", update);
    };
  }, [api]);

  return count;
};

const ARROW_CLASS = `grid size-8 place-items-center rounded-[6px] bg-green-800 p-0 text-white disabled:cursor-default disabled:bg-[#9ed3b2] ${FOCUS_RING}`;

const ARROW_LABEL = {
  back: "Indicador anterior",
  forward: "Próximo indicador",
} as const;

// Seta do carrossel: lê do embla se ainda há para onde rolar.
const CarouselArrow = ({
  direction,
}: {
  direction: keyof typeof ARROW_LABEL;
}) => {
  const carousel = useCarousel();
  const back = direction === "back";

  return (
    <button
      type="button"
      aria-label={ARROW_LABEL[direction]}
      disabled={back ? !carousel.canScrollPrev : !carousel.canScrollNext}
      onClick={back ? carousel.scrollPrev : carousel.scrollNext}
      className={ARROW_CLASS}
    >
      <ProtoIcon name={direction} size={16} stroke={2.6} />
    </button>
  );
};

const CarouselDots = ({ count, active }: { count: number; active: number }) => (
  <div aria-hidden="true" className="flex gap-2">
    {Array.from({ length: count }, (_, index) => (
      <i
        key={index}
        className={`size-2 rounded-full transition-colors duration-200 ${index === active ? "bg-green-1000" : "bg-grey-300"}`}
      />
    ))}
  </div>
);

// Setas e bolinhas só abaixo de 1100 px e quando há o que rolar.
const CarouselControls = () => {
  const { canScrollPrev, canScrollNext, currentItem } = useCarousel();
  const snapCount = useSnapCount();

  if (!canScrollPrev && !canScrollNext) return null;

  return (
    <div className="mt-3 flex items-center justify-center gap-6 min-[1100px]:hidden">
      <CarouselArrow direction="back" />
      <CarouselDots count={snapCount} active={currentItem} />
      <CarouselArrow direction="forward" />
    </div>
  );
};

/**
 * Faixa de indicadores (`.bns` do protótipo): cards em grade; abaixo de
 * 1100 px, o carrossel de `ui/carousel` com setas e bolinhas. Os textos e os
 * valores vêm prontos em `cells`; `label` nomeia o carrossel.
 *
 * @example <ProtoStatCards label="Indicadores do IDH" cells={[{ icon: "idh", label: "IDH", value: "0,702" }]} state="ok" onRetry={retry} />
 */
export const ProtoStatCards = ({
  label,
  cells,
  state,
  onRetry,
}: {
  label: string;
  cells: ProtoStatCell[];
  state: ProtoCardState;
  onRetry: () => void;
}) => (
  <Carousel opts={CAROUSEL_OPTIONS} aria-label={label}>
    <CarouselContent wrapperClassName="-m-0.5 p-0.5" className={TRACK_CLASS}>
      {cells.map((cell) => (
        <CarouselItem key={cell.label} className={ITEM_CLASS}>
          <Cell cell={cell} state={state} onRetry={onRetry} />
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselControls />
  </Carousel>
);
