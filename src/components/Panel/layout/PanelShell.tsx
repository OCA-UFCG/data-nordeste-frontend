import type { ReactNode } from "react";

// Cor do macrotema: faixa do painel e cabeçalho dos cards de destaque.
const DEFAULT_TONE_BODY = {
  value: "text-green-800",
  surface: "bg-grey-100",
  tab: "aria-selected:border-green-800 aria-selected:text-green-800",
};

export const PANEL_TONES = {
  orange: {
    shell: "bg-orange-500",
    card: "bg-orange-900",
    ...DEFAULT_TONE_BODY,
  },
  pink: { shell: "bg-pink-600", card: "bg-pink-800", ...DEFAULT_TONE_BODY },
  green: { shell: "bg-green-800", card: "bg-green-1000", ...DEFAULT_TONE_BODY },

  idh: {
    shell: "bg-[#7c46e1]",
    card: "bg-[#6d34cd]",
    value: "text-[#018f39]",
    surface: "bg-grey-200",
    tab: "aria-selected:border-[#7c46e1] aria-selected:text-[#6d34cd]",
  },
} as const;

export type PanelTone = keyof typeof PANEL_TONES;

export const PanelMessage = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg bg-white p-6 text-base text-grey-1100 shadow-sm">
    {children}
  </p>
);
