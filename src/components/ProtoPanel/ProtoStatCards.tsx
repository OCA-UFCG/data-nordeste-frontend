"use client";

import { Fragment, useEffect, useState } from "react";
import {
  type ProtoCardState,
  ProtoSkeleton,
} from "@/components/ProtoPanel/ProtoCard";
import {
  ProtoCardMenu,
  type ProtoCardImage,
} from "@/components/ProtoPanel/ProtoCardMenu";
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
import { buildStatImage } from "@/features/panels/statImage";
import { svgMarkupSource } from "@/lib/chartImage";
import { cn } from "@/lib/utils";

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

// `row`: a faixa de cinco indicadores do IDH. `hero`: o número de destaque do
// perfil demográfico, em card único e maior. `pair`: os dois números do PIB
// (`.pib .bns`), do tamanho do `hero`, lado a lado e em carrossel só até 700 px.
export type ProtoStatVariant = "row" | "hero" | "pair";

// `hero` nos cards: o tamanho grande, que o `pair` também usa.
const CELL_BASE = `flex h-full min-w-0 flex-col rounded-[8px] border border-grey-300 bg-white p-4 ${CARD_SHADOW}`;
const ROW_CELL_CLASS = `${CELL_BASE} min-h-[118px]`;
const HERO_CELL_CLASS = `${CELL_BASE} min-h-[132px]`;

const cellClass = (hero: boolean) => (hero ? HERO_CELL_CLASS : ROW_CELL_CLASS);

// Cor do ícone do card: o IDH usa o tom do painel; o perfil passa a sua.
const DEFAULT_ICON_CLASS =
  "bg-(--proto-accent-soft) text-(--proto-accent-strong)";

// "Baixar imagem" do indicador: o card é HTML, então o número é redesenhado
// em SVG a partir da célula. Só no card carregado; com erro não há o que baixar.
const statCardImage = (cell: ProtoStatCell): ProtoCardImage => ({
  getSource: () => svgMarkupSource(buildStatImage(cell)),
});

const CellTop = ({
  icon,
  label,
  iconClassName,
  image,
}: {
  icon: ProtoIconName;
  label: string;
  iconClassName: string;
  image?: ProtoCardImage;
}) => (
  <div className="flex min-h-[34px] items-center gap-2.5">
    {/* cn: o painel pode trocar o canto do chip (o PIB usa um círculo). */}
    <span
      className={cn(
        "grid size-8 flex-none place-items-center rounded-[8px]",
        iconClassName,
      )}
    >
      <ProtoIcon name={icon} size={20} />
    </span>
    <div className="min-w-0 text-[13px] leading-[17px] font-medium">
      {label}
    </div>
    <div className="-mt-1.5 -mr-2 ml-auto flex-none self-start">
      <ProtoCardMenu title={label} chart={image} />
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

// Valor, legenda e variação nas alturas do card pronto, que tem os três.
const PillValueLoading = () => (
  <div className="mt-auto pt-2.5">
    <ProtoSkeleton className="h-9 w-[60%]" />
    <ProtoSkeleton className="mt-0.5 h-3.5 w-[35%]" />
    <ProtoSkeleton className="mt-2 h-5 w-[30%]" />
  </div>
);

const CellLoading = ({ hero, pill }: { hero: boolean; pill: boolean }) => (
  <div aria-busy="true" className={cellClass(hero)}>
    <div className="flex min-h-[34px] items-center gap-2.5">
      <ProtoSkeleton className="size-8" />
      <ProtoSkeleton className={`h-3.5 ${pill ? "w-[40%]" : "w-[60%]"}`} />
    </div>
    {pill ? (
      <PillValueLoading />
    ) : (
      <ProtoSkeleton className="mt-auto h-7 w-[70%]" />
    )}
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
  pill,
  iconClassName,
}: {
  cell: ProtoStatCell;
  state: ProtoCardState;
  onRetry: () => void;
  hero: boolean;
  pill: boolean;
  iconClassName: string;
}) => {
  if (state === "loading") return <CellLoading hero={hero} pill={pill} />;
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
    <div
      aria-busy={state === "stale"}
      className={`${cellClass(hero)} ${staleClass(state === "stale")}`}
    >
      <CellTop
        icon={cell.icon}
        label={cell.label}
        iconClassName={iconClassName}
        image={statCardImage(cell)}
      />
      <CellValue cell={cell} hero={hero} />
    </div>
  );
};

// Do 1100 px (`row`) ou 701 px (`pair`) em diante o embla desliga e os cards
// viram grade. Espaço entre os cards: no carrossel é o padding do item (o
// embla mede os slides, não o `gap`), por isso o passo acompanha a classe sem
// número fixo. `controls` esconde setas e bolinhas na mesma faixa da grade.
const CAROUSEL_LAYOUT = {
  row: {
    opts: {
      align: "start",
      breakpoints: { "(min-width: 1100px)": { active: false } },
    },
    track:
      "-ml-3 min-[1100px]:ml-0 min-[1100px]:grid min-[1100px]:grid-cols-5 min-[1100px]:gap-4",
    item: "basis-1/3 pl-3 max-[700px]:basis-full min-[1100px]:basis-auto min-[1100px]:pl-0",
    controls: "min-[1100px]:hidden",
  },
  pair: {
    opts: {
      align: "start",
      breakpoints: { "(min-width: 701px)": { active: false } },
    },
    track:
      "-ml-3 min-[701px]:ml-0 min-[701px]:grid min-[701px]:grid-cols-2 min-[701px]:gap-4",
    item: "basis-full pl-3 min-[701px]:basis-auto min-[701px]:pl-0",
    controls: "min-[701px]:hidden",
  },
} as const;

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

// Setas e bolinhas só enquanto é carrossel e quando há o que rolar.
const CarouselControls = ({ className }: { className: string }) => {
  const { canScrollPrev, canScrollNext, currentItem } = useCarousel();
  const snapCount = useSnapCount();

  if (!canScrollPrev && !canScrollNext) return null;

  return (
    <div className={`mt-3 flex items-center justify-center gap-6 ${className}`}>
      <CarouselArrow direction="back" />
      <CarouselDots count={snapCount} active={currentItem} />
      <CarouselArrow direction="forward" />
    </div>
  );
};

/**
 * Faixa de indicadores (`.bns` do protótipo): cards em grade; abaixo de
 * 1100 px, o carrossel de `ui/carousel` com setas e bolinhas. Os textos e os
 * valores vêm prontos em `cells`; `label` nomeia o carrossel. `variant="hero"`:
 * um card só, sem carrossel (o número de destaque do perfil). `iconClassName`:
 * cor do chip do ícone (padrão: o tom do painel). `variant="pair"`: dois cards
 * grandes lado a lado, com carrossel só até 700 px (o PIB).
 *
 * @example <ProtoStatCards label="Indicadores do IDH" cells={[{ icon: "idh", label: "IDH", value: "0,702" }]} state="ok" onRetry={retry} />
 */
export const ProtoStatCards = ({
  label,
  cells,
  state,
  onRetry,
  variant = "row",
  iconClassName = DEFAULT_ICON_CLASS,
  withPill = false,
}: {
  label: string;
  cells: ProtoStatCell[];
  state: ProtoCardState;
  onRetry: () => void;
  variant?: ProtoStatVariant;
  iconClassName?: string;

  // Os cards prontos têm a variação (`pill`): o esqueleto reserva a altura dela.
  withPill?: boolean;
}) => {
  const renderCell = (cell: ProtoStatCell) => (
    <Cell
      cell={cell}
      state={state}
      onRetry={onRetry}
      hero={variant !== "row"}
      pill={withPill}
      iconClassName={iconClassName}
    />
  );

  if (variant === "hero") {
    return (
      <div className="grid grid-cols-1">
        {cells.map((cell) => (
          <Fragment key={cell.label}>{renderCell(cell)}</Fragment>
        ))}
      </div>
    );
  }

  const layout = CAROUSEL_LAYOUT[variant];

  return (
    <Carousel opts={layout.opts} aria-label={label}>
      <CarouselContent wrapperClassName="-m-0.5 p-0.5" className={layout.track}>
        {cells.map((cell) => (
          <CarouselItem key={cell.label} className={layout.item}>
            {renderCell(cell)}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselControls className={layout.controls} />
    </Carousel>
  );
};
