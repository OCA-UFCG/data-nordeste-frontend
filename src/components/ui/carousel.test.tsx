import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Carousel,
  CarouselAutoplayToggle,
  CarouselContent,
  CarouselItem,
  DotButton,
} from "./carousel";

const SLIDE_COUNT = 3;

type EmblaListener = () => void;

// jsdom has no layout, so the real embla sees zero-width slides, collapses
// them to one snap and never starts autoplay. This fake exposes only the
// slice of the embla API that the carousel components call.
class AutoplayPluginFake {
  private playing = true;

  constructor(private readonly emit: (event: string) => void) {}

  isPlaying = () => this.playing;

  play = () => {
    this.playing = true;
    this.emit("autoplay:play");
  };

  stop = () => {
    this.playing = false;
    this.emit("autoplay:stop");
  };
}

class EmblaApiFake {
  private listeners = new Map<string, Set<EmblaListener>>();
  readonly autoplay = new AutoplayPluginFake((event) => this.emit(event));

  plugins = () => ({ autoplay: this.autoplay });
  scrollSnapList = () => Array.from({ length: SLIDE_COUNT }, (_, i) => i);
  selectedScrollSnap = () => 0;
  canScrollPrev = () => true;
  canScrollNext = () => true;
  scrollTo = vi.fn();
  scrollPrev = vi.fn();
  scrollNext = vi.fn();

  on = (event: string, listener: EmblaListener) => {
    const set = this.listeners.get(event) ?? new Set<EmblaListener>();
    set.add(listener);
    this.listeners.set(event, set);

    return this;
  };

  off = (event: string, listener: EmblaListener) => {
    this.listeners.get(event)?.delete(listener);

    return this;
  };

  private emit(event: string) {
    this.listeners.get(event)?.forEach((listener) => listener());
  }
}

let emblaApiFake = new EmblaApiFake();

vi.mock("embla-carousel-react", () => ({
  default: () => [vi.fn(), emblaApiFake],
}));

const renderCarousel = () =>
  render(
    <Carousel>
      <CarouselContent>
        {Array.from({ length: SLIDE_COUNT }, (_, i) => (
          <CarouselItem key={i}>Slide {i + 1}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselAutoplayToggle />
      {Array.from({ length: SLIDE_COUNT }, (_, i) => (
        <DotButton key={i} slideIndex={i} />
      ))}
    </Carousel>,
  );

const setupCarousel = ({ reducedMotion }: { reducedMotion: boolean }) => {
  emblaApiFake = new EmblaApiFake();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: reducedMotion }),
  );
  renderCarousel();
};

describe("DotButton", () => {
  // Regression: the slide index used to be passed as tabIndex, giving the dots
  // tabindex 1..n, which scrambles Tab order (axe rule "tabindex").
  it("keeps the dots in the natural tab order", () => {
    setupCarousel({ reducedMotion: false });

    const dots = screen.getAllByRole("button", { name: /Ir para o slide/ });

    expect(dots).toHaveLength(SLIDE_COUNT);
    dots.forEach((dot) => expect(dot).not.toHaveAttribute("tabindex"));
    expect(dots[0]).toHaveAttribute("aria-current", "true");
  });
});

describe("CarouselAutoplayToggle", () => {
  it("pauses and resumes the autoplay", async () => {
    setupCarousel({ reducedMotion: false });

    const pause = await screen.findByRole("button", {
      name: "Pausar troca automática de slides",
    });
    await userEvent.click(pause);
    expect(emblaApiFake.autoplay.isPlaying()).toBe(false);

    const resume = await screen.findByRole("button", {
      name: "Retomar troca automática de slides",
    });
    await userEvent.click(resume);

    expect(
      await screen.findByRole("button", {
        name: "Pausar troca automática de slides",
      }),
    ).toBeInTheDocument();
  });

  it("starts paused when the OS asks for reduced motion", async () => {
    setupCarousel({ reducedMotion: true });

    expect(
      await screen.findByRole("button", {
        name: "Retomar troca automática de slides",
      }),
    ).toBeInTheDocument();
    expect(emblaApiFake.autoplay.isPlaying()).toBe(false);
  });
});
