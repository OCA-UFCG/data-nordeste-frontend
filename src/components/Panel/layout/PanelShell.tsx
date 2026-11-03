import type { ReactNode } from "react";

// Cor do macrotema: faixa do painel e cabeçalho dos cards de destaque.
export const PANEL_TONES = {
  orange: { shell: "bg-orange-500", card: "bg-orange-900" },
  pink: { shell: "bg-pink-600", card: "bg-pink-800" },
} as const;

export type PanelTone = keyof typeof PANEL_TONES;

export const PanelMessage = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg bg-white p-6 text-base text-grey-1100 shadow-sm">
    {children}
  </p>
);
