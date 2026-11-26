import { afterEach, describe, expect, it, vi } from "vitest";
import DemoLayout from "./layout";

// notFound() do Next interrompe a renderização lançando um erro; o mock faz o mesmo.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound");
  },
}));

describe("DemoLayout", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("responde 404 sem a flag (prod)", () => {
    vi.stubEnv("DEMOS_HABILITADAS", "");
    expect(() => DemoLayout({ children: "demo" })).toThrow("notFound");
  });

  it("mostra a demo com a flag (gamma e beta)", () => {
    vi.stubEnv("DEMOS_HABILITADAS", "1");
    expect(DemoLayout({ children: "demo" })).toBe("demo");
  });
});
