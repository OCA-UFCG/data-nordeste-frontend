import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CollapsibleText } from "@/components/Panel/texts/CollapsibleText";

// O jsdom não faz layout: as alturas e o ResizeObserver são simulados.
class ResizeObserverFake {
  static instances: ResizeObserverFake[] = [];

  constructor(private readonly callback: () => void) {
    ResizeObserverFake.instances.push(this);
  }

  observe() {}

  disconnect() {}

  fire() {
    this.callback();
  }
}

const setHeights = (scrollHeight: number, clientHeight: number) => {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
    scrollHeight,
  );
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(
    clientHeight,
  );
};

const readMore = () => screen.queryByRole("button", { name: "Ler mais" });

describe("CollapsibleText", () => {
  beforeEach(() => {
    ResizeObserverFake.instances = [];
    vi.stubGlobal("ResizeObserver", ResizeObserverFake);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, "fonts");
  });

  // Sem medida no servidor, o botão já vem no HTML: o caso comum (texto longo)
  // não empurra o conteúdo na hidratação.
  it("renders the read-more button on the server", () => {
    const html = renderToString(<CollapsibleText text="Texto longo." />);

    expect(html).toContain("Ler mais");
  });

  it("hides the button when the text fits in three lines", () => {
    setHeights(72, 72);
    render(<CollapsibleText text="Texto curto." />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers to read more when the text is cut, and to read less after", () => {
    setHeights(200, 72);
    render(<CollapsibleText text="Texto longo." />);
    fireEvent.click(readMore()!);

    expect(screen.getByRole("button", { name: "Ler menos" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("measures again when the box resizes", () => {
    setHeights(72, 72);
    render(<CollapsibleText text="Texto que passa a quebrar." />);
    setHeights(120, 72);
    act(() => ResizeObserverFake.instances.at(-1)!.fire());

    expect(readMore()).toBeInTheDocument();
  });

  it("measures again when the web font finishes loading", async () => {
    let fontsLoaded = () => {};
    const ready = new Promise<void>((resolve) => (fontsLoaded = resolve));

    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready },
    });
    setHeights(72, 72);
    render(<CollapsibleText text="Texto que quebra com a fonte nova." />);
    expect(readMore()).not.toBeInTheDocument();

    setHeights(96, 72);
    await act(async () => fontsLoaded());

    expect(readMore()).toBeInTheDocument();
  });
});
