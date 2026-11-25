import { describe, expect, it } from "vitest";
import { protoIconMarkup } from "@/components/ProtoPanel/protoIconMarkup";

describe("protoIconMarkup", () => {
  it("writes the shapes of an icon as SVG markup", () => {
    const markup = protoIconMarkup("usd");

    expect(markup).toContain('<circle cx="12" cy="12" r="9"/>');
    expect(markup).toContain("<path d=");
  });

  it("flattens fragments with several shapes", () => {
    const markup = protoIconMarkup("renda");

    expect(markup).toContain("<rect");
    expect(markup).toContain("<circle");
  });

  it("writes a single-shape icon without a wrapper", () => {
    expect(protoIconMarkup("close")).toBe('<path d="M6 6l12 12M18 6L6 18"/>');
  });

  it("throws with the unknown name", () => {
    expect(() => protoIconMarkup("nope")).toThrow('"nope"');
  });
});
