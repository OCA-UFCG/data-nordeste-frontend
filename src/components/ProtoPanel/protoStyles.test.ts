import { describe, expect, it } from "vitest";
import { protoToneStyle } from "@/components/ProtoPanel/protoStyles";

const vars = (tone: Parameters<typeof protoToneStyle>[0]) =>
  protoToneStyle(tone) as Record<string, string>;

describe("protoToneStyle", () => {
  it("gives the PIB icon chip its own stronger orange", () => {
    expect(vars("pib")["--proto-accent-chip"]).toBe("#ffe7cf");
    expect(vars("pib")["--proto-accent-strong"]).toBe("#c2570c");
  });

  it("falls back to the soft accent for tones without a chip color", () => {
    expect(vars("idh")["--proto-accent-chip"]).toBe(
      vars("idh")["--proto-accent-soft"],
    );
  });
});
