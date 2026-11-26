import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePibYearField } from "@/components/PibDashboard/usePibYearField";

// O jsdom não tem matchMedia: a tela casa só as consultas pedidas.
class MediaFake {
  constructor(private readonly matching: string[]) {}

  readonly matchMedia = (query: string) => ({
    matches: this.matching.includes(query),
  });
}

const PHONE = "(max-width: 700px)";

const renderWithSelect = () => {
  const select = document.createElement("button");

  select.scrollIntoView = vi.fn();
  document.body.append(select);
  const hook = renderHook(() => usePibYearField());

  hook.result.current.yearRef.current = select;

  return { select, result: hook.result, unmount: hook.unmount };
};

describe("usePibYearField", () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("scrolls to the year select, then focuses it with the ring on desktop", () => {
    vi.stubGlobal("matchMedia", new MediaFake([]).matchMedia);
    const { select, result } = renderWithSelect();

    act(() => result.current.pickYear());

    expect(select.scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "smooth",
    });
    expect(document.activeElement).not.toBe(select);
    act(() => vi.advanceTimersByTime(250));
    expect(document.activeElement).toBe(select);
    expect(select).toHaveClass("animate-proto-ring");
    expect(result.current.sheetOpen).toBe(false);
  });

  it("opens the filters sheet instead on a phone", () => {
    vi.stubGlobal("matchMedia", new MediaFake([PHONE]).matchMedia);
    const { select, result } = renderWithSelect();

    act(() => result.current.pickYear());

    expect(result.current.sheetOpen).toBe(true);
    expect(select.scrollIntoView).not.toHaveBeenCalled();
  });

  it("flashes the ring on the year select only on desktop", () => {
    vi.stubGlobal("matchMedia", new MediaFake([]).matchMedia);
    const { select, result } = renderWithSelect();

    result.current.flashYear();
    expect(select).toHaveClass("animate-proto-ring");

    select.classList.remove("animate-proto-ring");
    vi.stubGlobal("matchMedia", new MediaFake([PHONE]).matchMedia);
    result.current.flashYear();
    expect(select).not.toHaveClass("animate-proto-ring");
  });

  it("schedules a single focus for two quick clicks", () => {
    vi.stubGlobal("matchMedia", new MediaFake([]).matchMedia);
    const { select, result } = renderWithSelect();
    const focus = vi.spyOn(select, "focus");

    act(() => result.current.pickYear());
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.pickYear());
    act(() => vi.advanceTimersByTime(400));

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("cancels the pending focus on unmount", () => {
    vi.stubGlobal("matchMedia", new MediaFake([]).matchMedia);
    const { select, result, unmount } = renderWithSelect();
    const focus = vi.spyOn(select, "focus");

    act(() => result.current.pickYear());
    unmount();
    act(() => vi.advanceTimersByTime(400));

    expect(focus).not.toHaveBeenCalled();
  });

  it("drops the ring class when the animation ends", () => {
    vi.stubGlobal("matchMedia", new MediaFake([]).matchMedia);
    const { select, result } = renderWithSelect();

    result.current.flashYear();
    expect(select).toHaveClass("animate-proto-ring");

    select.dispatchEvent(new Event("animationend"));
    expect(select).not.toHaveClass("animate-proto-ring");
  });
});
