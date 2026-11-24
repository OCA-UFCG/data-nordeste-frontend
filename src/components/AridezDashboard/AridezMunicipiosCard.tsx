"use client";

import { memo, useState, type PointerEvent } from "react";
import type { AridezCardProps } from "@/components/AridezDashboard/aridezCardProps";
import { AridezClassLegend } from "@/components/AridezDashboard/AridezClassLegend";
import { ARIDEZ_CARD_INFO } from "@/components/AridezDashboard/aridezTexts";
import { ARIDEZ_COLORS } from "@/components/AridezDashboard/aridezTheme";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import {
  ProtoTooltip,
  type TooltipAt,
} from "@/components/ProtoPanel/ProtoTooltip";
import {
  ARIDEZ_CLASSES,
  classShares,
  type AridezClassKey,
} from "@/features/panels/aridez/aridezClasses";
import {
  formatAreaKm2,
  formatSharePercent,
} from "@/features/panels/aridez/aridezFormat";
import type { AridezMunicipio } from "@/features/panels/aridez/aridezPanel";

const TITLE = "Classificação do índice de aridez por município (%)";
const MOBILE_TITLE = "Classificação por município (%)";

// O % só aparece dentro do trecho quando cabe (12% para cima, como no protótipo).
const MIN_LABELED_SHARE = 12;

const ROW_CLASS =
  "grid min-h-[26px] grid-cols-[minmax(110px,170px)_1fr] items-center gap-3 [contain-intrinsic-size:auto_26px] [content-visibility:auto] max-[700px]:grid-cols-1 max-[700px]:gap-1";

const describeRow = (row: AridezMunicipio) => {
  const shares = classShares(row.areas);

  return ARIDEZ_CLASSES.filter(({ key }) => shares[key] > 0)
    .map(({ key, label }) => `${label} ${formatSharePercent(shares[key])}`)
    .join(", ");
};

const Segments = ({ row }: { row: AridezMunicipio }) => {
  const shares = classShares(row.areas);

  return ARIDEZ_CLASSES.filter(({ key }) => shares[key] > 0).map((item) => (
    <i
      key={item.key}
      data-mun={row.cdMun}
      data-classe={item.key}
      className="flex min-w-0.5 items-center justify-center overflow-hidden text-[11px] leading-none whitespace-nowrap not-italic"
      style={{
        flex: `${shares[item.key]} 1 0`,
        background: item.color,
        color: item.ink,
        boxShadow:
          item.key === "subumido"
            ? `inset 0 0 0 1px ${ARIDEZ_COLORS.subumidoEdge}`
            : undefined,
      }}
    >
      {shares[item.key] >= MIN_LABELED_SHARE ? (
        <b className="font-semibold tabular-nums">
          {formatSharePercent(shares[item.key])}
        </b>
      ) : null}
    </i>
  ));
};

const MunicipioRow = ({ row }: { row: AridezMunicipio }) => (
  <li className={ROW_CLASS} aria-label={`${row.nome}: ${describeRow(row)}`}>
    <span className="text-right text-[11.5px] leading-[14px] max-[700px]:text-left max-[700px]:text-[13px] max-[700px]:leading-[17px]">
      {row.nome}
    </span>
    <span
      aria-hidden="true"
      className="flex h-[22px] overflow-hidden rounded-[2px] bg-grey-200 max-[700px]:h-5"
    >
      <Segments row={row} />
    </span>
  </li>
);

type SegmentHover = { cdMun: string; key: AridezClassKey } & TooltipAt;

const segmentAt = (event: PointerEvent<HTMLElement>): SegmentHover | null => {
  const target = event.target as HTMLElement;
  const segment = target.closest<HTMLElement>("[data-mun]");

  if (!segment?.dataset.mun) return null;

  return {
    cdMun: segment.dataset.mun,
    key: segment.dataset.classe as AridezClassKey,
    x: event.clientX,
    y: event.clientY,
  };
};

const SegmentTooltip = ({
  hover,
  rows,
}: {
  hover: SegmentHover;
  rows: AridezMunicipio[];
}) => {
  const row = rows.find((item) => item.cdMun === hover.cdMun);
  const item = ARIDEZ_CLASSES.find(({ key }) => key === hover.key);

  if (!row || !item) return null;

  return (
    <ProtoTooltip
      at={hover}
      title={row.nome}
      rows={[
        {
          color: item.color,
          label: item.label,
          value: formatSharePercent(classShares(row.areas)[item.key]),
        },
        {
          color: "transparent",
          label: "Área",
          value: formatAreaKm2(row.areas[item.key]),
        },
      ]}
    />
  );
};

// PERF: a área inteira tem perto de 1.800 municípios; o memo evita refazer a
// lista quando só o estado do card muda (esmaecido → normal) ou a dica se
// move. Um só ouvinte na lista (delegação), não um por trecho.
const MunicipioList = memo(function MunicipioList({
  rows,
  onHover,
}: {
  rows: AridezMunicipio[];
  onHover: (hover: SegmentHover | null) => void;
}) {
  return (
    <ul
      onPointerMove={(event) => onHover(segmentAt(event))}
      onPointerLeave={() => onHover(null)}
      tabIndex={0}
      aria-label="Municípios"
      className="mt-2 flex max-h-[430px] flex-col gap-2 overflow-y-auto pr-1.5 max-[700px]:max-h-[380px]"
    >
      {rows.map((row) => (
        <MunicipioRow key={row.cdMun} row={row} />
      ))}
    </ul>
  );
});

const countHint = (count: number) =>
  `${count} município${count > 1 ? "s" : ""}${count > 10 ? " · role a lista para ver mais" : ""}.`;

/**
 * Card "Classificação do índice de aridez por município (%)": para cada
 * município do recorte, a divisão da sua área entre as classes, em barras de
 * 100%.
 *
 * @example <AridezMunicipiosCard data={panel} place="Nordeste · Pernambuco" state="ok" onRetry={retry} />
 */
export const AridezMunicipiosCard = ({
  data,
  place,
  ...status
}: AridezCardProps) => {
  const [hover, setHover] = useState<SegmentHover | null>(null);

  return (
    <ProtoCard
      {...status}
      title={TITLE}
      mobileTitle={MOBILE_TITLE}
      subtitle={`${place} · ${data.filters.ano} · % da área do município`}
      kind="rank"
      actions={
        <>
          <ProtoCardInfo title={TITLE} text={ARIDEZ_CARD_INFO.municipios} />
          <ProtoCardMenu title={TITLE} />
        </>
      }
    >
      <AridezClassLegend />
      <MunicipioList rows={data.porMunicipio} onHover={setHover} />
      {hover ? <SegmentTooltip hover={hover} rows={data.porMunicipio} /> : null}
      {data.porMunicipio.length > 1 ? (
        <p className="mt-2 text-xs text-grey-800">
          {countHint(data.porMunicipio.length)}
        </p>
      ) : null}
    </ProtoCard>
  );
};
