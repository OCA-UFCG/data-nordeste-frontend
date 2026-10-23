import { ChartCard, ChartNotice } from "@/components/Panel/ChartCard";
import type { ChartPoint } from "@/features/panels/chartOptions";
import { RankedBars } from "@/components/Panel/RankedBars";
import {
  FNE_CHART_TITLES,
  type FneChart,
} from "@/components/FneDashboard/fneTheme";
import type { FneVisao } from "@/features/panels/fne/fneFilters";
import { FNE_FORMATTERS, NO_RIDE } from "@/features/panels/fne/fneLabels";
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

const chartPoints = (data: FnePanelData, chart: FneChart, visao: FneVisao) =>
  toFneChartPoints(data[chart], visao, {
    sorted: !ORDINAL_CHARTS.has(chart),
  }).filter((point) => point.value > 0);

const NO_CONTRACTS = "Sem contratações neste recorte.";

const Bars = ({
  points,
  visao,
  emptyText = NO_CONTRACTS,
}: {
  points: ChartPoint[];
  visao: FneVisao;
  emptyText?: string;
}) =>
  points.length ? (
    <RankedBars
      points={points}
      formatValue={FNE_FORMATTERS[visao]}
      barClassName="bg-green-800"
      valueClassName={VALUE_WIDTH[visao]}
    />
  ) : (
    <ChartNotice>{emptyText}</ChartNotice>
  );

export const FneBarCard = ({
  chart,
  data,
  visao,
}: {
  chart: Exclude<FneChart, "rides">;
  data: FnePanelData;
  visao: FneVisao;
}) => (
  <ChartCard title={FNE_CHART_TITLES[visao][chart]}>
    <Bars points={chartPoints(data, chart, visao)} visao={visao} />
  </ChartCard>
);

// "Fora de RIDE" soma a maior parte dos municípios e achataria as barras das
// RIDEs; vira uma linha de texto. São 33 RIDEs: a lista rola dentro do card.
export const FneRideCard = ({
  data,
  visao,
}: {
  data: FnePanelData;
  visao: FneVisao;
}) => {
  const points = chartPoints(data, "rides", visao);
  const outside = points.find((point) => point.label === NO_RIDE);
  const title = FNE_CHART_TITLES[visao].rides;

  return (
    <ChartCard title={title}>
      {outside ? (
        <p className="mb-3 rounded-md bg-grey-100 px-3 py-2 text-sm text-grey-1100">
          Municípios fora de RIDE:{" "}
          <strong>{FNE_FORMATTERS[visao](outside.value)}</strong>
        </p>
      ) : null}
      <div
        tabIndex={0}
        aria-label={`${title}: role para ver a lista inteira`}
        className="max-h-[32rem] overflow-y-auto pr-1 focus:outline-2 focus:outline-green-800"
      >
        <Bars
          points={points.filter((point) => point !== outside)}
          visao={visao}
          emptyText={outside ? "Nenhuma RIDE neste recorte." : NO_CONTRACTS}
        />
      </div>
    </ChartCard>
  );
};
