"use client";

import { ChartCard } from "@/components/Panel/ChartCard";
import { HorizontalBarChart } from "@/components/Panel/HorizontalBarChart";
import { PanelCarousel } from "@/components/Panel/PanelCarousel";
import { PanelInfo } from "@/components/Panel/PanelInfo";
import {
  AtividadeList,
  formatParticipacao,
  type AtividadeSelection,
} from "@/components/PibDashboard/AtividadeList";
import { PIB_ATIVIDADE_TOOLTIP } from "@/components/PibDashboard/pibTheme";
import type { DataTableContent } from "@/components/Panel/DataTable";
import type {
  ChartPoint,
  ValueFormatter,
} from "@/features/panels/chartOptions";
import {
  lacksSectorData,
  PIB_VAB_LAST_YEAR,
  type PibPanelData,
} from "@/features/panels/pib/pibPanel";

const VAB_TITLE = "Valor Adicionado Bruto (VAB) por setor";
const ATIVIDADE_TITLE = "Participação da atividade com maior VAB no PIB";

// Um título só, com os dois do Power BI, quando nenhum dos dois tem dados.
const SECTORS_TITLE = `${VAB_TITLE} e participação da atividade com maior VAB no PIB`;

// IMPORTANT: altura fixa no xl, com aviso ou gráficos: o mapa segue a altura desta
// coluna e mudaria de tamanho ao trocar de ano. Os gráficos preenchem o que sobra.
const SECTORS_HEIGHT = "xl:h-[30rem]";

// Corpo dos cards no xl: gráfico, lista, aviso e tabela ocupam a altura toda.
const FILL_XL = "xl:h-auto xl:min-h-0 xl:flex-1";
const TABLE_CLASS = `h-64 sm:h-72 ${FILL_XL}`;

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

const AtividadeInfo = () => (
  <PanelInfo
    label="Sobre a participação da atividade com maior VAB"
    className="text-grey-800"
  >
    {PIB_ATIVIDADE_TOOLTIP}
  </PanelInfo>
);

const VabNotice = ({ onShowYear }: { onShowYear: (ano: number) => void }) => (
  <div
    className={`flex flex-col items-center justify-center gap-4 py-6 text-center ${FILL_XL}`}
  >
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

// Anos sem VAB (após PIB_VAB_LAST_YEAR): um aviso no lugar dos dois iguais
// (meia coluna vazia no desktop, dois slides repetidos no celular).
const SectorsNotice = ({
  onShowYear,
}: {
  onShowYear: (ano: number) => void;
}) => (
  <div className={`flex [&>*]:flex-1 ${SECTORS_HEIGHT}`}>
    <ChartCard title={SECTORS_TITLE}>
      <VabNotice onShowYear={onShowYear} />
    </ChartCard>
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
  if (lacksSectorData(data)) return <SectorsNotice onShowYear={onShowYear} />;
  const notice = <VabNotice onShowYear={onShowYear} />;

  return (
    <PanelCarousel
      label="Valor Adicionado Bruto"
      columns={`xl:grid-cols-2 ${SECTORS_HEIGHT}`}
      alignHeaders
    >
      <ChartCard
        title={VAB_TITLE}
        tableClassName={TABLE_CLASS}
        toolbarInside
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
            className={`h-64 w-full sm:h-72 ${FILL_XL}`}
          />
        ) : (
          notice
        )}
      </ChartCard>
      <ChartCard
        title={ATIVIDADE_TITLE}
        info={<AtividadeInfo />}
        tableClassName={TABLE_CLASS}
        toolbarInside
        table={
          data.atividades.length
            ? toTable(
                ATIVIDADE_TITLE,
                ["Atividade", "Participação no PIB"],
                data.atividades,
                formatParticipacao,
              )
            : undefined
        }
      >
        {data.atividades.length ? (
          <AtividadeList points={data.atividades} {...selection} />
        ) : (
          notice
        )}
      </ChartCard>
    </PanelCarousel>
  );
};
