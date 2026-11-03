"use client";

import { type ReactNode, useState } from "react";
import {
  DataTable,
  type DataTableContent,
} from "@/components/Panel/cards/DataTable";

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

const CardToolbar = ({
  table,
  info,
  showTable,
  onToggle,
}: {
  table?: DataTableContent;
  info?: ReactNode;
  showTable: boolean;
  onToggle: () => void;
}) => (
  <div className="flex shrink-0 items-center">
    {table ? <TableToggle showTable={showTable} onToggle={onToggle} /> : null}
    {info}
  </div>
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
  const toolbar =
    table || info ? (
      <CardToolbar
        table={table}
        info={info}
        showTable={showTable}
        onToggle={() => setShowTable((value) => !value)}
      />
    ) : null;

  return (
    <section className="flex min-h-0 min-w-0 flex-col gap-3">
      {/* Título longo em card estreito: os botões descem para a linha de baixo
          em vez de espremer o título. -my-2: o botão de 44 px não aumenta a linha. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h2 className="text-lg font-semibold text-grey-1100 sm:text-xl">
          {title}
        </h2>
        {toolbar ? <div className="-my-2 ml-auto">{toolbar}</div> : null}
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
