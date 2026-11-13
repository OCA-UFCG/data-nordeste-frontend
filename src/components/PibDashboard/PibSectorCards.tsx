"use client";

import type { ReactNode } from "react";
import { PibBars } from "@/components/PibDashboard/PibBars";
import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import {
  PIB_CARD_FOOTER,
  PIB_CARD_INFO,
} from "@/components/PibDashboard/pibTexts";
import { PIB_COLORS } from "@/components/PibDashboard/pibTheme";
import { ProtoCard, ProtoCardNotice } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import { formatPercent } from "@/features/panels/format";
import {
  buildAtividadeBars,
  buildVabBars,
} from "@/features/panels/pib/pibBars";
import { formatPibReais, formatPibTick } from "@/features/panels/pib/pibFormat";
import {
  listPibYearsWithoutVab,
  PIB_VAB_LAST_YEAR,
} from "@/features/panels/pib/pibPanel";

const VAB_TITLE = "Valor Adicionado Bruto (VAB) por setor";
const ATIVIDADE_TITLE = "Participação da atividade com maior VAB no PIB";

// Sem VAB (ano sem dado), o subtítulo fica com a unidade do protótipo.
const NO_DATA_UNIT = "bilhões";

export type PibSectorCardProps = PibCardProps & {
  onSelectYear: (ano: number) => void;
};

const Hint = ({ children }: { children: ReactNode }) => (
  <p className="mt-2 text-xs text-grey-800">{children}</p>
);

// Anos sem dado setorial (depois de PIB_VAB_LAST_YEAR): o aviso leva ao último
// ano que tem.
const YearNotice = ({
  onSelectYear,
}: {
  onSelectYear: (ano: number) => void;
}) => (
  <ProtoCardNotice
    tone="warn"
    action={{
      label: `Ver ${PIB_VAB_LAST_YEAR}, último ano disponível`,
      onClick: () => onSelectYear(PIB_VAB_LAST_YEAR),
    }}
  >
    <b>ATENÇÃO:</b> Os dados para os anos de{" "}
    {listPibYearsWithoutVab().join(" e ")} ainda não foram disponibilizados.
  </ProtoCardNotice>
);

// Os dois cards de setor têm a mesma moldura; muda o título, o ⓘ e o corpo.
const SectorCard = ({
  title,
  unit,
  info,
  children,
  data,
  place,
  onSelectYear,
  ...status
}: PibSectorCardProps & {
  title: string;
  unit: string;
  info: string;
  children: ReactNode;
}) => (
  <ProtoCard
    {...status}
    footer={PIB_CARD_FOOTER}
    title={title}
    subtitle={`${place} · ${data.filters.ano} · ${unit}`}
    kind="rank"
    actions={
      <>
        <ProtoCardInfo title={title} text={info} />
        <ProtoCardMenu title={title} />
      </>
    }
  >
    {data.filters.ano > PIB_VAB_LAST_YEAR ? (
      <YearNotice onSelectYear={onSelectYear} />
    ) : (
      children
    )}
  </ProtoCard>
);

/**
 * Card "VAB por setor": o valor adicionado de cada grande setor no ano, em
 * barras, na unidade que os dados pedem (bilhões no Nordeste, milhões num
 * município pequeno).
 *
 * @example <PibVabCard data={panel} place="Nordeste" state="ok" onRetry={retry} onSelectYear={pickYear} />
 */
export const PibVabCard = (props: PibSectorCardProps) => {
  const bars = buildVabBars(props.data.vab ?? []);

  return (
    <SectorCard
      {...props}
      title={VAB_TITLE}
      unit={`R$ ${bars.rows.length ? bars.unit.label : NO_DATA_UNIT}`}
      info={PIB_CARD_INFO.vab}
    >
      {bars.rows.length ? (
        <>
          <PibBars
            rows={bars.rows}
            ticks={bars.ticks}
            color={PIB_COLORS.vabBar}
            formatValue={formatPibReais}
            formatTick={formatPibTick}
          />
          <Hint>
            Soma dos setores: {formatPibReais(bars.total)} · valores em R${" "}
            {bars.unit.label} no eixo.
          </Hint>
        </>
      ) : (
        <Hint>Sem VAB informado neste território.</Hint>
      )}
    </SectorCard>
  );
};

/**
 * Card "Participação da atividade com maior VAB no PIB": as três atividades
 * de maior participação no PIB do território, em %.
 *
 * @example <PibAtividadeCard data={panel} place="Nordeste" state="ok" onRetry={retry} onSelectYear={pickYear} />
 */
export const PibAtividadeCard = (props: PibSectorCardProps) => {
  const bars = buildAtividadeBars(props.data.atividades);

  return (
    <SectorCard
      {...props}
      title={ATIVIDADE_TITLE}
      unit="% do PIB"
      info={PIB_CARD_INFO.atividade}
    >
      {bars.rows.length ? (
        <>
          <PibBars
            rows={bars.rows}
            ticks={bars.ticks}
            color={PIB_COLORS.atividadeBar}
            formatValue={(value) => formatPercent(value)}
            formatTick={(value) => `${value}%`}
          />
          <Hint>
            Participação de cada atividade no PIB de {props.place} em{" "}
            {props.data.filters.ano}.
          </Hint>
        </>
      ) : (
        <Hint>Sem atividades com participação informada neste território.</Hint>
      )}
    </SectorCard>
  );
};
