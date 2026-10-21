import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const PanelShell = ({
  theme,
  icon: ThemeIcon,
  source,
  children,
}: {
  theme: string;
  icon: LucideIcon;
  source: string;
  children: ReactNode;
}) => (
  <div className="mx-auto flex w-full max-w-[1440px] flex-col px-4 py-6 sm:px-6 lg:px-20">
    <div className="flex w-full items-center justify-end gap-2 rounded-t-lg bg-orange-500 px-4 py-3 text-lg font-semibold text-white sm:px-6">
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
