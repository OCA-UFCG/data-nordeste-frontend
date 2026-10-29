"use client";

import { ChartCard } from "@/components/Panel/ChartCard";
import { HorizontalBarChart } from "@/components/Panel/HorizontalBarChart";
import { PanelCarousel } from "@/components/Panel/PanelCarousel";
import { PanelInfo } from "@/components/Panel/PanelInfo";
import { RankedBars } from "@/components/Panel/RankedBars";
import { PIB_ATIVIDADE_TOOLTIP } from "@/components/PibDashboard/pibTheme";
import type { DataTableContent } from "@/components/Panel/DataTable";
import type {
  ChartPoint,
  ValueFormatter,
} from "@/features/panels/chartOptions";
import { formatPercent } from "@/features/panels/format";
import {
  PIB_VAB_LAST_YEAR,
  type PibPanelData,
} from "@/features/panels/pib/pibPanel";

const VAB_TITLE = "Valor Adicionado Bruto (VAB) por setor";
const ATIVIDADE_TITLE = "Participação da atividade com maior VAB no PIB";
const percent = (value: number) => formatPercent(value, 2);

const toTable = (
  caption: string,
  columns: [string, string],
  points: ChartPoint[],
  format: ValueFormatter,
): DataTableContent => ({
  caption,
  columns,
  rows: points.map((point) => [point.label, format(point.value)]),
});

// -my-3: o botão mantém 44 px de toque sem deixar o título mais alto que o
// do card ao lado.
const AtividadeInfo = () => (
  <PanelInfo
    label="Sobre a participação da atividade com maior VAB"
    className="-my-3 text-grey-800"
  >
    {PIB_ATIVIDADE_TOOLTIP}
  </PanelInfo>
);

// Degradê no rodapé: mostra que a lista continua rolando.
type AtividadeSelection = {
  atividade: string | null;
  onSelectAtividade: (atividade: string | null) => void;
};

const AtividadeList = ({
  data,
  atividade,
  onSelectAtividade,
}: AtividadeSelection & { data: PibPanelData }) => (
  <div className="relative">
    <div className="h-64 overflow-y-auto pb-6 sm:h-72">
      <RankedBars
        points={data.atividades}
        formatValue={percent}
        selectedLabel={atividade}
        onSelect={onSelectAtividade}
      />
    </div>
    {data.atividades.length > 4 ? (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white"
      />
    ) : null}
  </div>
);

// Mesma altura dos gráficos que substitui: trocar de ano não redimensiona o mapa.
const VabNotice = ({ onShowYear }: { onShowYear: (ano: number) => void }) => (
  <div className="flex h-64 flex-col items-center justify-center gap-4 text-center sm:h-72">
    <p className="text-base font-medium text-grey-1000">
      <strong>ATENÇÃO:</strong> Os dados para os anos de 2022 e 2023 ainda não
      foram disponibilizados.
    </p>
    <button
      type="button"
      onClick={() => onShowYear(PIB_VAB_LAST_YEAR)}
      className="inline-flex min-h-11 items-center rounded-md bg-green-800 px-5 text-sm font-medium text-grey-100 hover:bg-green-900"
    >
      Ver {PIB_VAB_LAST_YEAR}, último ano disponível
    </button>
  </div>
);

export const PibSectorCharts = ({
  data,
  formatReais,
  onShowYear,
  ...selection
}: AtividadeSelection & {
  data: PibPanelData;
  formatReais: ValueFormatter;
  onShowYear: (ano: number) => void;
}) => {
  const notice = <VabNotice onShowYear={onShowYear} />;

  return (
    <PanelCarousel label="Valor Adicionado Bruto" columns="xl:grid-cols-2">
      <ChartCard
        title={VAB_TITLE}
        table={
          data.vab
            ? toTable(VAB_TITLE, ["Setor", "VAB"], data.vab, formatReais)
            : undefined
        }
      >
        {data.vab ? (
          <HorizontalBarChart
            points={data.vab}
            formatValue={formatReais}
            label="Gráfico de barras do VAB por setor"
          />
        ) : (
          notice
        )}
      </ChartCard>
      <ChartCard
        title={ATIVIDADE_TITLE}
        info={<AtividadeInfo />}
        table={
          data.atividades.length
            ? toTable(
                ATIVIDADE_TITLE,
                ["Atividade", "Participação no PIB"],
                data.atividades,
                percent,
              )
            : undefined
        }
      >
        {data.atividades.length ? (
          <AtividadeList data={data} {...selection} />
        ) : (
          notice
        )}
      </ChartCard>
    </PanelCarousel>
  );
};
