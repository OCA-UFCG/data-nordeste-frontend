"use client";

import { useState } from "react";
import { ChartCard, ChartNotice } from "@/components/Panel/ChartCard";
import type { FneVisao } from "@/features/panels/fne/fneFilters";
import { FNE_FORMATTERS } from "@/features/panels/fne/fneLabels";
import type { FneHighlight } from "@/features/panels/fne/fnePanel";

const MOBILE_PREVIEW = 5;

const LABELS: Record<FneVisao, { total: string; destaque: string }> = {
  quantidade: {
    total: "Quantidade total",
    destaque: "Quantidade destaque",
  },
  valor: { total: "Valor total", destaque: "Valor destaque" },
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-wrap gap-x-1">
    <dt className="font-semibold">{label}:</dt>
    <dd className="break-words">{value}</dd>
  </div>
);

const HighlightItem = ({
  item,
  rank,
  visao,
  ano,
  hiddenOnMobile,
}: {
  item: FneHighlight;
  rank: number;
  visao: FneVisao;
  ano: number;
  hiddenOnMobile: boolean;
}) => {
  const format = FNE_FORMATTERS[visao];

  return (
    <li
      className={`gap-3 rounded-lg border-l-[6px] border-green-800 bg-white p-4 shadow-sm ${hiddenOnMobile ? "hidden lg:flex" : "flex"}`}
    >
      <span className="text-lg font-bold tabular-nums text-green-800">
        {rank}º
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-bold text-green-900">
            {item.nome} – {item.uf}
          </h3>
          <span className="text-sm text-grey-800">{ano}</span>
        </div>
        <dl className="flex flex-col gap-1 text-sm text-grey-1100">
          <Field label="Código IBGE" value={item.cdMun} />
          <Field label={LABELS[visao].total} value={format(item.total)} />
        </dl>
        <div className="flex flex-col gap-1 rounded-md bg-green-100 p-3 text-sm text-grey-1100">
          <p className="font-semibold text-green-900">Destaque para:</p>
          <dl className="flex flex-col gap-1">
            <Field label="Setor" value={item.setor} />
            <Field label="Finalidade" value={item.finalidade} />
            <Field label="Programa" value={item.programa} />
            <Field
              label={LABELS[visao].destaque}
              value={format(item.destaque)}
            />
          </dl>
        </div>
      </div>
    </li>
  );
};

// No celular abre com 5 e um botão mostra os 20; no desktop a lista rola no card.
export const FneHighlights = ({
  items,
  visao,
  ano,
}: {
  items: FneHighlight[];
  visao: FneVisao;
  ano: number;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <ChartCard title="Top 20 municípios destaque em contratações">
      {items.length ? (
        <>
          <ol
            tabIndex={0}
            aria-label="Municípios em destaque"
            className="flex flex-col gap-3 lg:max-h-[36rem] lg:overflow-y-auto lg:pr-1"
          >
            {items.map((item, index) => (
              <HighlightItem
                key={item.cdMun}
                item={item}
                rank={index + 1}
                visao={visao}
                ano={ano}
                hiddenOnMobile={!expanded && index >= MOBILE_PREVIEW}
              />
            ))}
          </ol>
          {items.length > MOBILE_PREVIEW ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              className="mt-3 h-10 w-full rounded-md border border-green-800 text-sm font-medium text-green-800 lg:hidden"
            >
              {expanded
                ? "Mostrar só os 5 primeiros"
                : `Ver os ${items.length} municípios`}
            </button>
          ) : null}
        </>
      ) : (
        <ChartNotice>Sem contratações neste recorte.</ChartNotice>
      )}
    </ChartCard>
  );
};
