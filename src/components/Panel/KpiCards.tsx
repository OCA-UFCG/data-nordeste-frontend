import type { LucideIcon } from "lucide-react";

export type KpiItem = { icon: LucideIcon; label: string; value: string };

const KpiCard = ({ icon: KpiIcon, label, value }: KpiItem) => (
  <div className="flex min-w-0 overflow-hidden rounded-lg bg-white shadow-sm">
    <div className="flex w-16 shrink-0 items-center justify-center bg-orange-800 text-white sm:w-20">
      <KpiIcon aria-hidden className="size-8 sm:size-10" strokeWidth={1.75} />
    </div>
    <div className="flex min-w-0 flex-col justify-center gap-1 px-4 py-4">
      <span className="text-sm font-medium text-grey-800 sm:text-base">
        {label}
      </span>
      <span className="whitespace-nowrap text-2xl font-bold leading-tight text-green-900 sm:text-3xl">
        {value}
      </span>
    </div>
  </div>
);

export const KpiCards = ({ items }: { items: KpiItem[] }) => (
  <div className="@container">
    <div className="grid grid-cols-1 gap-4 @[34rem]:grid-cols-2">
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  </div>
);
