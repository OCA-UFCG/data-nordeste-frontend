"use client";

import { useCallback, useMemo } from "react";
import { EChart } from "@/components/EChart/EChart";
import { ChartCard, ChartNotice } from "@/components/Panel/cards/ChartCard";
import type { DataTableContent } from "@/components/Panel/cards/DataTable";
import { ColumnChart } from "@/components/Panel/charts/ColumnChart";
import {
  RankedBars,
  type PreviewHandler,
} from "@/components/Panel/charts/RankedBars";
import {
  FNE_BAR_CLASS,
  FNE_BAR_COLOR,
  FNE_CHART_TITLES,
  FNE_PORTE_COLORS,
  type FneChart,
} from "@/components/FneDashboard/fneTheme";
import {
  buildPieOption,
  FOCUS_BAR,
  type ChartPoint,
} from "@/features/panels/chartOptions";
import type { FneVisao } from "@/features/panels/fne/fneFilters";
import {
  FNE_FORMATTERS,
  formatFneLabel,
  NO_RIDE,
} from "@/features/panels/fne/fneLabels";
import {
  toFneChartPoints,
  type FnePanelData,
} from "@/features/panels/fne/fnePanel";

// Porte segue a ordem do menor ao maior; os demais, do maior valor ao menor.
const ORDINAL_CHARTS = new Set<FneChart>(["portes"]);

// "R$ 50,20 bi" não cabe nos 4rem padrão do RankedBars.
const VALUE_WIDTH: Record<FneVisao, string> = {
  quantidade: "w-24",
  valor: "w-28",
};

const NO_CONTRACTS = "Sem contratações neste recorte.";

const chartPoints = (data: FnePanelData, chart: FneChart, visao: FneVisao) =>
  toFneChartPoints(data[chart], visao, {
    sorted: !ORDINAL_CHARTS.has(chart),
  }).filter((point) => point.value > 0);

// O hover do mapa re-renderiza a visão geral; sem memo, cada um redesenharia
// os gráficos que não mudaram.
const useChartPoints = (data: FnePanelData, chart: FneChart, visao: FneVisao) =>
  useMemo(() => chartPoints(data, chart, visao), [data, chart, visao]);

const toTable = (
  caption: string,
  points: ChartPoint[],
  visao: FneVisao,
): DataTableContent => ({
  caption,
  columns: ["Categoria", visao === "valor" ? "Valor" : "Quantidade"],
  rows: points.map((point) => [
    point.label,
    FNE_FORMATTERS[visao](point.value),
  ]),
});

type FneChartProps = {
  chart: FneChart;
  data: FnePanelData;
  visao: FneVisao;
};

export const FneColumnCard = ({ chart, data, visao }: FneChartProps) => {
  const title = FNE_CHART_TITLES[visao][chart];
  const points = useChartPoints(data, chart, visao);
  const columns = useMemo(
    () => ({
      categories: points.map((point) => point.label),
      series: [
        {
          name: title,
          color: FNE_BAR_COLOR,
          values: points.map((point) => point.value),
        },
      ],
    }),
    [points, title],
  );

  return (
    <ChartCard title={title} table={toTable(title, points, visao)}>
      {points.length ? (
        <ColumnChart
          label={`Gráfico de colunas: ${title}`}
          {...columns}
          formatLabel={formatFneLabel}
          slotPerBar={30}
          formatValue={FNE_FORMATTERS[visao]}
          rotateLabels={points.length > 3}
          grow
        />
      ) : (
        <ChartNotice>{NO_CONTRACTS}</ChartNotice>
      )}
    </ChartCard>
  );
};

// Barras deitadas para os rótulos longos (estados e tipologias) caberem no
// celular sem girar; `spread` reparte a sobra da linha entre as barras.
export const FneBarCard = ({
  chart,
  data,
  visao,
  selectedLabel,
  onSelect,
  onPreview,
}: FneChartProps & {
  selectedLabel?: string | null;
  onSelect?: (label: string | null) => void;
  onPreview?: PreviewHandler;
}) => {
  const title = FNE_CHART_TITLES[visao][chart];
  const points = useChartPoints(data, chart, visao);

  return (
    <ChartCard title={title} table={toTable(title, points, visao)}>
      {points.length ? (
        <RankedBars
          points={points}
          formatValue={FNE_FORMATTERS[visao]}
          barClassName={FNE_BAR_CLASS}
          valueClassName={VALUE_WIDTH[visao]}
          selectedLabel={selectedLabel}
          onSelect={onSelect}
          onPreview={onPreview}
          rowClassName="group-hover/bars:opacity-60 hover:bg-green-100/60 hover:opacity-100! aria-pressed:bg-green-100"
          spread
        />
      ) : (
        <ChartNotice>{NO_CONTRACTS}</ChartNotice>
      )}
    </ChartCard>
  );
};

// Pizza, como no ArcGIS, nas cores das fatias de lá. A fatia apontada fica
// em cor cheia e as outras esmaecem; o rótulo só aparece a partir de 4%.
const porteOption = (points: ChartPoint[], visao: FneVisao) => {
  const option = buildPieOption(
    points.map((point) => ({
      ...point,
      color: FNE_PORTE_COLORS[point.label] ?? FNE_BAR_COLOR,
    })),
    FNE_FORMATTERS[visao],
  );
  const [series] = option.series as { label: object }[];

  return {
    ...option,
    series: [
      {
        ...series,
        ...FOCUS_BAR,
        radius: ["0%", "70%"],
        label: {
          ...series.label,
          fontSize: 13,
          textBorderColor: "#292829",
          textBorderWidth: 2,
          formatter: ({ percent }: { percent: number }) =>
            percent < 4 ? "" : `${Math.round(percent)}%`,
        },
      },
    ],
  };
};

export const FnePorteCard = ({
  data,
  visao,
}: {
  data: FnePanelData;
  visao: FneVisao;
}) => {
  const title = FNE_CHART_TITLES[visao].portes;
  const points = useChartPoints(data, "portes", visao);
  const buildOption = useCallback(
    () => porteOption(points, visao),
    [points, visao],
  );

  return (
    <ChartCard title={title} table={toTable(title, points, visao)}>
      {points.length ? (
        <EChart
          buildOption={buildOption}
          label={`Gráfico de pizza: ${title}`}
          className="min-h-80 w-full flex-1"
        />
      ) : (
        <ChartNotice>{NO_CONTRACTS}</ChartNotice>
      )}
    </ChartCard>
  );
};

// "Fora de RIDE" soma a maior parte dos municípios e achataria as barras das
// RIDEs; vira uma linha de texto. São 33 RIDEs: a lista rola dentro do card.
export const FneRideCard = ({
  data,
  visao,
}: {
  data: FnePanelData;
  visao: FneVisao;
}) => {
  const points = useChartPoints(data, "rides", visao);
  const outside = points.find((point) => point.label === NO_RIDE);
  const rides = points.filter((point) => point !== outside);
  const title = FNE_CHART_TITLES[visao].rides;

  return (
    <ChartCard title={title} table={toTable(title, points, visao)}>
      {outside ? (
        <p className="mb-3 rounded-md bg-grey-100 px-3 py-2 text-sm text-grey-1100">
          Municípios fora de RIDE:{" "}
          <strong>{FNE_FORMATTERS[visao](outside.value)}</strong>
        </p>
      ) : null}
      {rides.length ? (
        <div
          tabIndex={0}
          aria-label={`${title}: role para ver a lista inteira`}
          className="max-h-[28rem] overflow-y-auto pr-1 focus:outline-2 focus:outline-green-800"
        >
          <RankedBars
            points={rides}
            formatValue={FNE_FORMATTERS[visao]}
            barClassName={FNE_BAR_CLASS}
            valueClassName={VALUE_WIDTH[visao]}
          />
        </div>
      ) : (
        <ChartNotice>
          {outside ? "Nenhuma RIDE neste recorte." : NO_CONTRACTS}
        </ChartNotice>
      )}
    </ChartCard>
  );
};
