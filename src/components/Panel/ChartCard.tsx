import type { ReactNode } from "react";

export const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="flex min-w-0 flex-col gap-3">
    <h2 className="text-lg font-semibold text-grey-1100 sm:text-xl">{title}</h2>
    <div className="min-w-0 rounded-lg bg-white p-3 shadow-sm sm:p-4">
      {children}
    </div>
  </section>
);

export const ChartNotice = ({ children }: { children: ReactNode }) => (
  <p className="flex min-h-48 items-center justify-center px-4 text-center text-base font-medium text-grey-1000">
    {children}
  </p>
);
