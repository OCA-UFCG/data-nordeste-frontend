"use client";

import { useMemo, useState } from "react";
import { municipiosPorPorte } from "@/features/panels/demografia/demografiaAnalise";
import type { MunicipioPoint } from "@/features/panels/demografia/demografiaPanel";

export const useDemografiaHighlight = (municipios: MunicipioPoint[]) => {
  const grupos = useMemo(() => municipiosPorPorte(municipios), [municipios]);
  const [porte, setPorte] = useState<string | null>(null);
  const [portePreview, setPortePreview] = useState<string | null>(null);
  const [munPreview, setMunPreview] = useState<string | null>(null);
  const codeByLabel = useMemo(
    () => new Map(municipios.map((item) => [item.label, item.code])),
    [municipios],
  );
  const highlightCodes = useMemo(() => {
    const code = munPreview ? codeByLabel.get(munPreview) : undefined;

    if (code) return new Set([code]);
    const shown = portePreview ?? porte;
    const grupo = grupos.find((item) => item.porte.label === shown);

    return grupo ? new Set(grupo.codes) : undefined;
  }, [munPreview, codeByLabel, portePreview, porte, grupos]);

  return {
    grupos,
    porte,
    setPorte,
    setPortePreview,
    setMunPreview,
    codeByLabel,
    highlightCodes,
  };
};
