"use client";

import { ChartCard, ChartNotice } from "@/components/Panel/cards/ChartCard";
import { GaugeChart } from "@/components/Panel/charts/GaugeChart";
import { HorizontalBarChart } from "@/components/Panel/charts/HorizontalBarChart";
import type {
  IdhGroupPoint,
  IdhGroupSerie,
} from "@/features/panels/idh/idhPanel";
import {
  formatIdhCard,
  formatRenda,
  IDH_GROUP_COLORS,
  NO_DATA,
} from "@/features/panels/idh/idhFormat";

type GroupValue = { label: string; point: IdhGroupPoint };

const CHART_HEIGHT = "h-48 w-full sm:h-56";

const pointsInYear = (groups: IdhGroupSerie[], ano: number): GroupValue[] =>
  groups.flatMap((group) => {
    const point = group.serie.find((item) => item.ano === ano);

    return point ? [{ label: group.label, point }] : [];
  });

const GaugePair = ({
  title,
  values,
  metric,
}: {
  title: string;
  values: GroupValue[];
  metric: "idh" | "gini";
}) => (
  <ChartCard title={title}>
    {values.length ? (
      <div className="grid grid-cols-2 gap-2">
        {values.map(({ label, point }) => (
          <GaugeChart
            key={label}
            label={`Medidor: ${title} · ${label}`}
            name={label}
            value={point[metric]}
            max={1}
            color={IDH_GROUP_COLORS[label]}
            formatValue={formatIdhCard}
            className={CHART_HEIGHT}
          />
        ))}
      </div>
    ) : (
      <ChartNotice>{NO_DATA}</ChartNotice>
    )}
  </ChartCard>
);

const GroupBars = ({
  title,
  values,
  metric,
}: {
  title: string;
  values: GroupValue[];
  metric: "rendaPerCapita" | "rendimento";
}) => (
  <ChartCard title={title}>
    {values.length ? (
      <HorizontalBarChart
        label={`Gráfico de barras: ${title}`}
        points={values.map(({ label, point }) => ({
          label,
          value: point[metric],
          color: IDH_GROUP_COLORS[label],
        }))}
        formatValue={formatRenda}
        className={CHART_HEIGHT}
      />
    ) : (
      <ChartNotice>{NO_DATA}</ChartNotice>
    )}
  </ChartCard>
);

export const IdhGroupView = ({
  groups,
  ano,
}: {
  groups: IdhGroupSerie[];
  ano: number;
}) => {
  const values = pointsInYear(groups, ano);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GaugePair title="IDH" values={values} metric="idh" />
      <GroupBars
        title="Renda per capita"
        values={values}
        metric="rendaPerCapita"
      />
      <GaugePair title="Índice de Gini" values={values} metric="gini" />
      <GroupBars
        title="Rendimento médio dos ocupados"
        values={values}
        metric="rendimento"
      />
    </div>
  );
};
