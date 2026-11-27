import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { metadata } from "./layout";

// next/font/google só funciona dentro do compilador do Next; o teste só precisa
// do objeto metadata, então a fonte vira um stub.
vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "inter" }),
}));

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: () => null,
}));

const APP_DIR = join(process.cwd(), "src", "app");

describe("ícones das abas", () => {
  it("não declara icons no metadata, para não sobrescrever as convenções de arquivo", () => {
    expect(metadata.icons).toBeUndefined();
  });

  it.each(["favicon.ico", "icon.svg", "apple-icon.png"])(
    "tem src/app/%s, que o Next serve com URL absoluta em todas as rotas",
    (fileName) => {
      expect(existsSync(join(APP_DIR, fileName))).toBe(true);
    },
  );
});
