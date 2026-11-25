import { describe, expect, it } from "vitest";
import { buildPosterBase } from "@/components/ProtoPanel/posterBase";
import { PROTO_TONES } from "@/components/ProtoPanel/protoStyles";

describe("buildPosterBase", () => {
  it("names the panel after the macrotheme and takes the tone accent", () => {
    const base = buildPosterBase({
      macroTheme: "Meio Ambiente",
      icon: "aridez",
      tone: "aridez",
      updatedAt: "11/2026",
      place: "Semiárido",
      chips: ["Ano: 2021"],
    });

    expect(base).toStrictEqual({
      panelName: "Painel de Meio Ambiente",
      icon: "aridez",
      accent: PROTO_TONES.aridez.accent,
      updatedAt: "11/2026",
      place: "Semiárido",
      chips: ["Ano: 2021"],
    });
  });
});
