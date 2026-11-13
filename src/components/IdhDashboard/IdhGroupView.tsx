"use client";

import {
  IDH_CARD_FOOTER,
  IDH_CARD_INFO,
} from "@/components/IdhDashboard/idhCardTexts";
import { IDH_COLORS } from "@/components/IdhDashboard/idhColors";
import {
  ProtoCard,
  ProtoCardNotice,
  type ProtoCardState,
} from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import { CARD_SHADOW } from "@/components/ProtoPanel/protoStyles";
import { formatNumber } from "@/features/panels/format";
import {
  compareIdhGroups,
  type IdhGroupMetric,
  type IdhGroupValue,
} from "@/features/panels/idh/idhGroupCompare";
import { formatIdhCard, formatRenda } from "@/features/panels/idh/idhFormat";
import {
  IDH_VISOES,
  idhPlaceName,
  type IdhPanelData,
} from "@/features/panels/idh/idhPanel";

type GroupVisao = "sexo" | "cor";

// Ordem do protótipo. Gini não tem página no catálogo (o item fica desativado).
const METRIC_CARDS: readonly {
  metric: IdhGroupMetric;
  title: string;
  catalog: boolean;
}[] = [
  { metric: "idh", title: "IDH", catalog: true },
  { metric: "rendaPerCapita", title: "Renda per capita", catalog: true },
  { metric: "gini", title: "Índice de Gini", catalog: false },
  {
    metric: "rendimento",
    title: "Rendimento médio dos ocupados",
    catalog: true,
  },
];

// `--sa` e `--sb` do protótipo: o primeiro grupo roxo, o segundo azul.
const GROUP_COLORS = [IDH_COLORS.accentStrong, IDH_COLORS.groupSecond];

const isIndex = (metric: IdhGroupMetric) =>
  metric === "idh" || metric === "gini";

// `.gi`: rótulo e valor, a barra de 12 px e a escala de 0 ao fim.
const GroupItem = ({
  item,
  color,
  max,
  metric,
}: {
  item: IdhGroupValue;
  color: string;
  max: number;
  metric: IdhGroupMetric;
}) => (
  <div className="mt-2.5 first:mt-1">
    <div className="flex justify-between text-[13px] leading-[18px]">
      <span>{item.label}</span>
      <b className="font-medium tabular-nums">
        {isIndex(metric) ? formatIdhCard(item.value) : formatRenda(item.value)}
      </b>
    </div>
    <div className="mt-2 h-3 overflow-hidden rounded-[6px] bg-grey-200">
      <i
        className="block h-full rounded-[6px] transition-[width] duration-350 motion-reduce:transition-none"
        style={{
          width: `${Math.min(item.value / max, 1) * 100}%`,
          background: color,
        }}
      />
    </div>
    <div className="mt-1.5 flex justify-between text-[10.5px] text-grey-800 tabular-nums">
      <span>{isIndex(metric) ? "0,00" : "0"}</span>
      <span>{isIndex(metric) ? formatIdhCard(max) : formatNumber(max)}</span>
    </div>
  </div>
);

const GroupCard = ({
  title,
  metric,
  catalog,
  visao,
  data,
  state,
  onRetry,
}: (typeof METRIC_CARDS)[number] & {
  visao: GroupVisao;
  data: IdhPanelData;
  state: ProtoCardState;
  onRetry: () => void;
}) => {
  const { values, max, gap } = compareIdhGroups(
    data[visao],
    data.filters.ano,
    metric,
  );
  const place = `${idhPlaceName(data)}, ${data.filters.ano}`;

  return (
    <ProtoCard
      footer={IDH_CARD_FOOTER}
      title={title}
      subtitle={gap ? `${gap} · ${place}` : place}
      kind="grp"
      state={state}
      onRetry={onRetry}
      actions={
        <>
          <ProtoCardInfo title={title} text={IDH_CARD_INFO.groups} />
          <ProtoCardMenu title={title} catalog={catalog} />
        </>
      }
    >
      {values.map((item, index) => (
        <GroupItem
          key={item.label}
          item={item}
          color={GROUP_COLORS[index]}
          max={max}
          metric={metric}
        />
      ))}
    </ProtoCard>
  );
};

// Real: só quando o banco não tem o grupo no lugar e no ano escolhidos.
const NoGroupData = ({
  visao,
  data,
  onReset,
}: {
  visao: GroupVisao;
  data: IdhPanelData;
  onReset: () => void;
}) => (
  <div
    className={`rounded-[8px] border border-grey-300 bg-white px-5 py-4 ${CARD_SHADOW}`}
  >
    <ProtoCardNotice
      tone="warn"
      action={{ label: "Ver Nordeste, 2021", onClick: onReset }}
    >
      <b>ATENÇÃO:</b> não há dados da{" "}
      {IDH_VISOES.find((item) => item.key === visao)?.label.toLowerCase()} para{" "}
      {idhPlaceName(data)} em {data.filters.ano}.
    </ProtoCardNotice>
  </div>
);

/**
 * Visão por sexo ou por cor (`.grp` do protótipo): um card por métrica, com
 * os dois grupos na mesma escala e a diferença entre eles no subtítulo.
 *
 * @example <IdhGroupView visao="sexo" data={panel} state="ok" onRetry={retry} onReset={reset} />
 */
export const IdhGroupView = ({
  visao,
  data,
  state,
  onRetry,
  onReset,
}: {
  visao: GroupVisao;
  data: IdhPanelData;
  state: ProtoCardState;
  onRetry: () => void;
  onReset: () => void;
}) => {
  const hasData =
    compareIdhGroups(data[visao], data.filters.ano, "idh").values.length > 0;

  if (state === "ok" && !hasData) {
    return <NoGroupData visao={visao} data={data} onReset={onReset} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
      {METRIC_CARDS.map((card) => (
        <GroupCard
          key={card.metric}
          {...card}
          visao={visao}
          data={data}
          state={state}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
};
