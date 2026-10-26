"use client";

import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "../Icon/Icon";
import {
  ComponentProps,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (i: number) => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  currentItem: number;
} & CarouselProps;

const CarouselContext = createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: ComponentProps<"div"> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins,
  );
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentItem, setCurrentItem] = useState(0);

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
    setCurrentItem(api.selectedScrollSnap());
  }, []);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev,
        canScrollNext,
        currentItem,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({
  className,
  wrapperClassName,
  ...props
}: ComponentProps<"div"> & { wrapperClassName?: string }) {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div
      ref={carouselRef}
      className={cn("overflow-hidden", wrapperClassName)}
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "px-0" : "py-2",
        className,
      )}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-lg cursor-pointer ",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <Icon
        id="arrow"
        size={8}
        className="cursor-pointer size-2 rotate-[-135deg]"
      />
      <span className="sr-only">Slide anterior</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-lg cursor-pointer ",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <Icon id="arrow" size={8} className="size-2 rotate-45" />
      <span className="sr-only">Próximo slide</span>
    </Button>
  );
}

type DotButtonProps = ComponentProps<typeof Button> & { slideIndex: number };

// The 24px button meets the WCAG 2.5.8 target size; the visible dot stays 12px.
function DotButton({
  className,
  variant = "ghost",
  size = "icon",
  slideIndex,
  ...props
}: DotButtonProps) {
  const { scrollTo, currentItem } = useCarousel();
  const isCurrent = currentItem === slideIndex;

  return (
    <Button
      data-slot="carousel-dots"
      aria-label={`Ir para o slide ${slideIndex + 1}`}
      aria-current={isCurrent ? "true" : undefined}
      variant={variant}
      size={size}
      className={cn("size-6 rounded-full cursor-pointer group", className)}
      onClick={() => scrollTo(slideIndex)}
      {...props}
    >
      <span
        className={cn(
          "size-3 rounded-full border border-grey-600 group-hover:bg-grey-300",
          isCurrent ? "bg-green-800 border-green-800" : "bg-grey-200",
        )}
      />
    </Button>
  );
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Tracks the carousel's Autoplay plugin, starting it paused when the OS asks
 * for reduced motion. Returns null when the carousel has no running autoplay.
 *
 * @example const autoplay = useCarouselAutoplay(api); autoplay?.toggle();
 */
function useCarouselAutoplay(api: CarouselApi) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAutoplay, setHasAutoplay] = useState(false);

  useEffect(() => {
    const autoplay = api?.plugins().autoplay;
    if (!api || !autoplay) return;

    if (window.matchMedia?.(REDUCED_MOTION_QUERY).matches) autoplay.stop();

    // WARNING: embla-carousel-autoplay 8.6 emits these events before it flips
    // its own flag, so isPlaying() read inside the listener is stale. Trust
    // the event name instead.
    const markPlaying = () => setIsPlaying(true);
    const markStopped = () => setIsPlaying(false);
    setHasAutoplay(api.scrollSnapList().length > 1);
    setIsPlaying(autoplay.isPlaying());
    api.on("autoplay:play", markPlaying).on("autoplay:stop", markStopped);

    return () => {
      api.off("autoplay:play", markPlaying).off("autoplay:stop", markStopped);
    };
  }, [api]);

  if (!hasAutoplay) return null;

  const toggle = () => {
    const autoplay = api?.plugins().autoplay;
    if (isPlaying) autoplay?.stop();
    else autoplay?.play();
  };

  return { isPlaying, toggle };
}

// WCAG 2.2.2: anything that moves on its own for more than 5 seconds must be
// pausable. Renders nothing when the carousel has no autoplay.
function CarouselAutoplayToggle({
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: ComponentProps<typeof Button>) {
  const { api } = useCarousel();
  const autoplay = useCarouselAutoplay(api);

  if (!autoplay) return null;

  return (
    <Button
      data-slot="carousel-autoplay-toggle"
      aria-label={
        autoplay.isPlaying
          ? "Pausar troca automática de slides"
          : "Retomar troca automática de slides"
      }
      variant={variant}
      size={size}
      className={cn("size-6 rounded-full cursor-pointer", className)}
      onClick={autoplay.toggle}
      {...props}
    >
      {autoplay.isPlaying ? <PauseGlyph /> : <PlayGlyph />}
    </Button>
  );
}

const PauseGlyph = () => (
  <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
    <rect x="2" y="1" width="3" height="10" fill="currentColor" />
    <rect x="7" y="1" width="3" height="10" fill="currentColor" />
  </svg>
);

const PlayGlyph = () => (
  <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
    <path d="M2 1 L11 6 L2 11 Z" fill="currentColor" />
  </svg>
);

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselAutoplayToggle,
  DotButton,
};
