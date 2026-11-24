"use client";

import type { ReactNode } from "react";
import { PibBars } from "@/components/PibDashboard/PibBars";
import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import { PIB_CARD_INFO } from "@/components/PibDashboard/pibTexts";
import { PIB_COLORS } from "@/components/PibDashboard/pibTheme";
import {
  ProtoCard,
  ProtoCardNotice,
  ProtoSkeleton,
} from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import { formatPercent } from "@/features/panels/format";
import {
  buildAtividadeBars,
  buildVabBars,
} from "@/features/panels/pib/pibBars";
import { formatPibReais, formatPibTick } from "@/features/panels/pib/pibFormat";
import {
  lacksPibSectorData,
  listPibYearsWithoutVab,
  type PibPanelData,
} from "@/features/panels/pib/pibPanel";

const VAB_TITLE = "Valor Adicionado Bruto (VAB) por setor";
const ATIVIDADE_TITLE = "Participação da atividade com maior VAB no PIB";

// Sem VAB (ano sem dado), o subtítulo fica com a unidade do protótipo.
const NO_DATA_UNIT = "bilhões";

export type PibSectorCardProps = PibCardProps & {
  onSelectYear: (ano: number) => void;
  onPickYear: () => void;
};

// A altura do aviso do ano padrão (sem dado setorial), que é o que a página
// abre mostrando.
// IMPORTANT: 214 px (286 px até 700 px) é a altura do `YearNotice` abaixo; se
// o aviso mudar de texto ou de ações, o esqueleto precisa mudar junto.
const SECTOR_SKELETON = (
  <ProtoSkeleton className="h-[214px] max-[700px]:h-[286px]" />
);

const Hint = ({ children }: { children: ReactNode }) => (
  <p className="mt-2 text-xs text-grey-800">{children}</p>
);

// Ano sem dado setorial: o aviso leva ao último ano com VAB ou ao select de Ano.
const YearNotice = ({
  data,
  onSelectYear,
  onPickYear,
}: Pick<PibSectorCardProps, "onSelectYear" | "onPickYear"> & {
  data: PibPanelData;
}) => {
  const { vabLastYear } = data;
  const pickYear = { label: "Escolher outro ano", onClick: onPickYear };

  return (
    <ProtoCardNotice
      tone="warn"
      action={
        vabLastYear === null
          ? pickYear
          : {
              label: `Ver ${vabLastYear}, último ano disponível`,
              onClick: () => onSelectYear(vabLastYear),
            }
      }
      secondaryAction={vabLastYear === null ? undefined : pickYear}
    >
      <b>ATENÇÃO:</b> Os dados para os anos de{" "}
      {listPibYearsWithoutVab(data).join(" e ")} ainda não foram
      disponibilizados.
    </ProtoCardNotice>
  );
};

// Os dois cards de setor têm a mesma moldura; muda o título, o ⓘ e o corpo.
const SectorCard = ({
  title,
  unit,
  info,
  children,
  data,
  place,
  onSelectYear,
  onPickYear,
  ...status
}: PibSectorCardProps & {
  title: string;
  unit: string;
  info: string;
  children: ReactNode;
}) => (
  <ProtoCard
    {...status}
    title={title}
    subtitle={`${place} · ${data.filters.ano} · ${unit}`}
    kind="rank"
    skeleton={SECTOR_SKELETON}
    actions={
      <>
        <ProtoCardInfo title={title} text={info} />
        <ProtoCardMenu title={title} />
      </>
    }
  >
    {lacksPibSectorData(data) ? (
      <YearNotice
        data={data}
        onSelectYear={onSelectYear}
        onPickYear={onPickYear}
      />
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
 * @example <PibVabCard data={panel} place="Nordeste" state="ok" onRetry={retry} onSelectYear={showYear} onPickYear={focusYear} />
 */
export const PibVabCard = (props: PibSectorCardProps) => {
  const bars = buildVabBars(props.data.vab ?? []);

  return (
    <SectorCard
      {...props}
      title={VAB_TITLE}
      unit={`R$ ${bars.rows.length ? bars.unit.label : NO_DATA_UNIT}`}
      info={PIB_CARD_INFO.vab(props.data.vabLastYear)}
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
 * @example <PibAtividadeCard data={panel} place="Nordeste" state="ok" onRetry={retry} onSelectYear={showYear} onPickYear={focusYear} />
 */
export const PibAtividadeCard = (props: PibSectorCardProps) => {
  const bars = buildAtividadeBars(props.data.atividades);

  return (
    <SectorCard
      {...props}
      title={ATIVIDADE_TITLE}
      unit="% do PIB"
      info={PIB_CARD_INFO.atividade(props.data.vabLastYear)}
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
