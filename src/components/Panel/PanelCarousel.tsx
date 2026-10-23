"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel";

// Do lg em diante o embla desliga e os itens viram grade (ver `columns`).
const DESKTOP_OFF = { "(min-width: 1024px)": { active: false } };

const STEP_BUTTON =
  "flex size-10 items-center justify-center rounded-lg bg-green-800 text-white disabled:opacity-50";

const CarouselControls = ({ count }: { count: number }) => {
  const carousel = useCarousel();
  const { scrollPrev, scrollNext, scrollTo, currentItem } = carousel;
  const { canScrollPrev, canScrollNext } = carousel;

  return (
    <div className="mt-6 flex items-center justify-center gap-6 lg:hidden">
      <button
        type="button"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Item anterior"
        className={STEP_BUTTON}
      >
        <ArrowLeft aria-hidden className="size-4" />
      </button>
      <div className="flex gap-2.5">
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`Ir para o item ${index + 1} de ${count}`}
            aria-current={index === currentItem}
            className="size-3 rounded-full bg-grey-300 aria-[current=true]:bg-green-800"
          />
        ))}
      </div>
      <button
        type="button"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Próximo item"
        className={STEP_BUTTON}
      >
        <ArrowRight aria-hidden className="size-4" />
      </button>
    </div>
  );
};

export const PanelCarousel = ({
  label,
  columns,
  children,
}: {
  label: string;
  columns: string;
  children: ReactNode[];
}) => (
  <Carousel
    aria-label={label}
    opts={{ align: "start", breakpoints: DESKTOP_OFF }}
  >
    <CarouselContent className={`-ml-6 lg:ml-0 lg:grid lg:gap-6 ${columns}`}>
      {children.map((child, index) => (
        <CarouselItem key={index} className="flex pl-6 lg:pl-0 [&>*]:flex-1">
          {child}
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselControls count={children.length} />
  </Carousel>
);
