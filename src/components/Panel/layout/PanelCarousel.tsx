"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { type ReactNode, useEffect } from "react";
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

const MOBILE_QUERY = "(max-width: 1023.98px)";

// No celular a janela acompanha a altura do slide visível; sem isso, todos ficam
// com a do mais alto e sobra faixa vazia. Do lg em diante o embla desliga.
const useFitToVisibleSlide = () => {
  const { api } = useCarousel();

  useEffect(() => {
    if (!api) return;
    const viewport = api.rootNode();
    const fit = () => {
      const slide = api.slideNodes()[api.selectedScrollSnap()];
      const mobile = window.matchMedia(MOBILE_QUERY).matches;

      viewport.style.height = mobile && slide ? `${slide.offsetHeight}px` : "";
    };
    const observer = new ResizeObserver(fit);

    api.slideNodes().forEach((slide) => observer.observe(slide));
    api.on("select", fit);
    api.on("reInit", fit);
    fit();

    return () => {
      observer.disconnect();
      api.off("select", fit);
      api.off("reInit", fit);
      viewport.style.height = "";
    };
  }, [api]);
};

const CarouselControls = ({ count }: { count: number }) => {
  const carousel = useCarousel();

  useFitToVisibleSlide();
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

// xl + `alignHeaders`: subgrid de duas linhas alinha cabeçalho e corpo mesmo com
// títulos de alturas diferentes; cada filho precisa desses dois blocos (ChartCard).
const ALIGNED_CONTENT = "xl:grid-rows-[auto_minmax(0,1fr)] xl:gap-y-3";
const ALIGNED_ITEM =
  "xl:row-span-2 xl:grid xl:grid-rows-subgrid xl:[&>*]:row-span-2 xl:[&>*]:grid xl:[&>*]:grid-rows-subgrid";

export const PanelCarousel = ({
  label,
  columns,
  alignHeaders = false,
  children,
}: {
  label: string;
  columns: string;
  alignHeaders?: boolean;
  children: ReactNode[];
}) => (
  <Carousel
    aria-label={label}
    opts={{ align: "start", breakpoints: DESKTOP_OFF }}
  >
    <CarouselContent
      wrapperClassName="transition-[height] duration-300 ease-out motion-reduce:transition-none"
      className={`-ml-6 items-start lg:ml-0 lg:grid lg:items-stretch lg:gap-6 ${columns} ${alignHeaders ? ALIGNED_CONTENT : ""}`}
    >
      {children.map((child, index) => (
        <CarouselItem
          key={index}
          className={`flex pl-6 lg:pl-0 [&>*]:flex-1 ${alignHeaders ? ALIGNED_ITEM : ""}`}
        >
          {child}
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselControls count={children.length} />
  </Carousel>
);
