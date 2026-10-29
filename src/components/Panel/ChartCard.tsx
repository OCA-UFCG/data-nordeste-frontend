"use client";

import { type ReactNode, useState } from "react";
import { DataTable, type DataTableContent } from "@/components/Panel/DataTable";

export const TableToggle = ({
  showTable,
  onToggle,
}: {
  showTable: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    aria-pressed={showTable}
    onClick={onToggle}
    className="min-h-11 shrink-0 rounded-md px-2 text-sm font-medium text-green-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-green-800"
  >
    {showTable ? "Ver gráfico" : "Ver tabela"}
  </button>
);

// `table`: os mesmos números em tabela, como o "Mostrar como tabela" do Power BI.
export const ChartCard = ({
  title,
  info,
  table,
  tableClassName,
  children,
}: {
  title: string;
  info?: ReactNode;
  table?: DataTableContent;
  tableClassName?: string;
  children: ReactNode;
}) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className="flex min-h-0 min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-grey-1100 sm:text-xl">
          {title}
        </h2>
        <div className="flex shrink-0 items-center">
          {table ? (
            <TableToggle
              showTable={showTable}
              onToggle={() => setShowTable((value) => !value)}
            />
          ) : null}
          {info}
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg bg-white p-3 shadow-sm sm:p-4">
        {table && showTable ? (
          <DataTable content={table} className={tableClassName} />
        ) : (
          children
        )}
      </div>
    </section>
  );
};

export const ChartNotice = ({ children }: { children: ReactNode }) => (
  <p className="flex min-h-48 flex-1 items-center justify-center px-4 text-center text-base font-medium text-grey-1000">
    {children}
  </p>
);
