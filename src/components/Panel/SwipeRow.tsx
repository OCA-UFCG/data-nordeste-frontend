import type { ReactNode } from "react";

// No celular vira carrossel de arrastar (scroll-snap); do lg em diante, grade.
export const SwipeRow = ({
  label,
  columns,
  children,
}: {
  label: string;
  columns: string;
  children: ReactNode[];
}) => (
  <ul
    aria-label={label}
    className={`-mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0 ${columns}`}
  >
    {children.map((child, index) => (
      <li
        key={index}
        className="flex w-[85%] shrink-0 snap-center lg:w-auto [&>*]:flex-1"
      >
        {child}
      </li>
    ))}
  </ul>
);
