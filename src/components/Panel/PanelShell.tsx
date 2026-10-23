import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Cor do macrotema: faixa do painel e cabeçalho dos cards de destaque.
export const PANEL_TONES = {
  orange: { shell: "bg-orange-500", card: "bg-orange-900" },
  pink: { shell: "bg-pink-600", card: "bg-pink-800" },
  green: { shell: "bg-green-800", card: "bg-green-1000" },
} as const;

export type PanelTone = keyof typeof PANEL_TONES;

export const PanelShell = ({
  theme,
  icon: ThemeIcon,
  source,
  tone = "orange",
  children,
}: {
  theme: string;
  icon: LucideIcon;
  source: string;
  tone?: PanelTone;
  children: ReactNode;
}) => (
  <div className="mx-auto flex w-full max-w-[1440px] flex-col px-4 py-6 sm:px-6 lg:px-20">
    <div
      className={`flex w-full items-center justify-end gap-2 rounded-t-lg px-4 py-3 text-lg font-semibold text-white sm:px-6 ${PANEL_TONES[tone].shell}`}
    >
      <ThemeIcon aria-hidden size={22} />
      {theme}
    </div>
    <div className="flex flex-col gap-6 rounded-b-lg bg-grey-200 p-3 sm:p-6">
      {children}
      <p className="text-sm leading-relaxed text-grey-900">{source}</p>
    </div>
  </div>
);

export const PanelHeader = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-5 rounded-lg bg-white p-4 shadow-sm sm:p-6">
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold text-grey-1100 sm:text-3xl">{title}</h1>
      <p className="text-base text-grey-800">{subtitle}</p>
    </div>
    {children}
  </div>
);

export const PanelMessage = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg bg-white p-6 text-base text-grey-1100 shadow-sm">
    {children}
  </p>
);
