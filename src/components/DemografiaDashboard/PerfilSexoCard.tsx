"use client";

import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import {
  sexColumns,
  type SexColumn,
} from "@/features/panels/demografia/perfilCharts";
import { formatShare } from "@/features/panels/demografia/demografiaAnalise";
import { formatPessoas } from "@/features/panels/format";

const TITLE = "População por sexo";

const COLUMN_COLOR: Record<SexColumn["label"], string> = {
  Mulher: "#c2395f",
  Homem: "#96b02e",
};

// A altura da coluna é a fração da maior (`--sh`, definida no corpo do card).
const SexColumnView = ({
  column,
  total,
}: {
  column: SexColumn;
  total: number;
}) => (
  <div className="flex flex-col items-center">
    <span className="text-[13px] font-semibold tabular-nums">
      {formatPessoas(column.value)}
    </span>
    <i
      title={`${column.label}: ${formatPessoas(column.value)} (${formatShare(column.value, total)})`}
      className="w-[104px] rounded-t-[2px] max-[700px]:w-[92px]"
      style={{
        height: `calc(var(--sh) * ${column.ratio})`,
        background: COLUMN_COLOR[column.label],
      }}
    />
    <span className="mt-0.5 text-[12px]">{column.label}</span>
  </div>
);

/**
 * Card "População por sexo": duas colunas, mulheres e homens, com a altura
 * proporcional e o valor de cada uma.
 *
 * @example <PerfilSexoCard data={panel} place="Nordeste" state="ok" onRetry={retry} />
 */
export const PerfilSexoCard = (props: PerfilCardProps) => {
  const { data, place } = props;
  const total = data.sexo.mulheres + data.sexo.homens;

  return (
    <ProtoCard
      title={TITLE}
      subtitle={`${place} · ${data.filters.ano}`}
      kind="rank"
      state={props.state}
      onRetry={props.onRetry}
      bodyClassName="flex flex-col justify-end [--sh:290px] max-[1000px]:[--sh:240px] max-[700px]:[--sh:200px]"
      actions={<ProtoCardMenu title={TITLE} />}
    >
      <div className="flex items-end justify-center gap-8">
        {sexColumns(data.sexo).map((column) => (
          <SexColumnView key={column.label} column={column} total={total} />
        ))}
      </div>
    </ProtoCard>
  );
};
