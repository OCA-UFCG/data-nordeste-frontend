import { describe, expect, it } from "vitest";

import {
  activeChip,
  type ChipHighlightAction,
  chipHighlightReducer,
  NO_CHIP_HIGHLIGHT,
} from "@/features/panelMap/chipHighlightState";

const after = (...actions: ChipHighlightAction[]) =>
  actions.reduce(chipHighlightReducer, NO_CHIP_HIGHLIGHT);

describe("chipHighlightReducer", () => {
  it("tirar o mouse não desfaz o destaque da pílula com foco", () => {
    const state = after(
      { type: "focus", index: 1 },
      { type: "hover", index: 2 },
      { type: "hover", index: null },
    );

    expect(activeChip(state)).toBe(1);
  });

  it("o mouse vence o foco enquanto está em cima", () => {
    const state = after(
      { type: "focus", index: 1 },
      { type: "hover", index: 2 },
    );

    expect(activeChip(state)).toBe(2);
  });

  it("perder o foco não desfaz o mouse em cima", () => {
    const state = after(
      { type: "hover", index: 2 },
      { type: "focus", index: 1 },
      { type: "blur" },
    );

    expect(activeChip(state)).toBe(2);
  });

  it("tocar alterna o destaque (Safari, sem foco no toque)", () => {
    expect(activeChip(after({ type: "tap", index: 0 }))).toBe(0);
    expect(
      activeChip(after({ type: "tap", index: 0 }, { type: "tap", index: 0 })),
    ).toBeNull();
  });

  it("tocar outra pílula troca o destaque", () => {
    const state = after({ type: "tap", index: 0 }, { type: "tap", index: 2 });

    expect(activeChip(state)).toBe(2);
  });

  it("tocar de novo desliga mesmo quando o toque também focou (Chrome)", () => {
    const state = after(
      { type: "focus", index: 0 },
      { type: "tap", index: 0 },
      { type: "tap", index: 0 },
    );

    expect(activeChip(state)).toBeNull();
  });

  it("perder o foco (tocar fora) desfaz o toque", () => {
    const state = after(
      { type: "focus", index: 0 },
      { type: "tap", index: 0 },
      { type: "blur" },
    );

    expect(activeChip(state)).toBeNull();
  });
});
