"use client";

import { type PointerEvent, useState } from "react";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import { formatShare } from "@/features/panels/demografia/demografiaAnalise";
import {
  describePyramidBand,
  pyramidBandLabel,
  pyramidRows,
  type PyramidRow,
} from "@/features/panels/demografia/perfilCharts";
import { formatPessoas } from "@/features/panels/format";

const TITLE = "População por faixa etária e sexo";
const INFO =
  "População residente por faixa etária de 10 anos, separada por sexo. Passe o mouse ou toque em uma faixa para ver os valores.";
const DEFAULT_BAND = "30 a 39 anos";
const MULHER_COLOR = "#c2395f";
const HOMEM_COLOR = "#96b02e";

// A faixa que abre selecionada: "30 a 39 anos" quando existe, senão a do meio.
const defaultBand = (rows: PyramidRow[]): PyramidRow | undefined =>
  rows.find((row) => row.label === DEFAULT_BAND) ??
  rows[Math.floor(rows.length / 2)];

const Dot = ({ color }: { color: string }) => (
  <i
    aria-hidden="true"
    className="inline-block size-[9px] rounded-full"
    style={{ background: color }}
  />
);

// Cabeçalho que lê a faixa ativa: o mouse prévia, o clique fixa.
const BandReader = ({ row }: { row: PyramidRow }) => {
  const total = row.mulheres + row.homens;

  return (
    <div aria-live="polite" className="mb-2.5 min-h-[38px] text-[12.5px]">
      <p>
        <span className="mr-3 inline-flex items-center gap-1.5">
          <Dot color={MULHER_COLOR} />
          Mulher <b className="tabular-nums">{formatPessoas(row.mulheres)}</b> (
          {formatShare(row.mulheres, total)})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Dot color={HOMEM_COLOR} />
          Homem <b className="tabular-nums">{formatPessoas(row.homens)}</b> (
          {formatShare(row.homens, total)})
        </span>
      </p>
      <small className="text-[11.5px] text-grey-800">
        {describePyramidBand(row).title}
      </small>
    </div>
  );
};

// Barra da pirâmide: o tamanho vem de `--mxw`, a largura máxima do lado.
const Bar = ({
  ratio,
  color,
  selected,
}: {
  ratio: number;
  color: string;
  selected: boolean;
}) => (
  <i
    className={`block h-[26px] rounded-[2px] ${selected ? "outline outline-2 outline-offset-1 outline-grey-1100" : ""}`}
    style={{ width: `calc(var(--mxw) * ${ratio})`, background: color }}
  />
);

const ValueLabel = ({
  value,
  selected,
}: {
  value: number;
  selected: boolean;
}) => (
  <span
    className={`text-[11.5px] tabular-nums whitespace-nowrap max-[700px]:text-[11px] ${selected ? "font-bold" : ""}`}
  >
    {formatPessoas(value)}
  </span>
);

// Uma faixa: mulheres à esquerda (cresce para a esquerda), rótulo no meio,
// homens à direita.
const PyramidRowButton = ({
  row,
  selected,
  onSelect,
  onHover,
}: {
  row: PyramidRow;
  selected: boolean;
  onSelect: () => void;
  onHover: (label: string | null) => void;
}) => {
  const short = pyramidBandLabel(row.label);

  // A linha tem a altura da barra (26 px, como no protótipo): sem padding vertical,
  // que somava 2 px. O contorno da faixa escolhida sai da barra, mas nada aqui tem
  // overflow oculto, então não é cortado.
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${short} anos: mulheres ${formatPessoas(row.mulheres)}, homens ${formatPessoas(row.homens)}`}
      onClick={onSelect}
      onPointerEnter={(event) => mouseOnly(event, () => onHover(row.label))}
      onPointerLeave={(event) => mouseOnly(event, () => onHover(null))}
      className="grid h-[26px] grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] items-center rounded-[6px] p-0 hover:bg-grey-100 max-[700px]:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)]"
    >
      <span className="flex min-w-0 items-center justify-end gap-1.5">
        <ValueLabel value={row.mulheres} selected={selected} />
        <Bar
          ratio={row.mulheresRatio}
          color={MULHER_COLOR}
          selected={selected}
        />
      </span>
      <span
        className={`text-center text-[12px] ${selected ? "font-bold" : ""}`}
      >
        {short}
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        <Bar ratio={row.homensRatio} color={HOMEM_COLOR} selected={selected} />
        <ValueLabel value={row.homens} selected={selected} />
      </span>
    </button>
  );
};

const PyramidLegend = () => (
  <ul className="mt-3 flex justify-center gap-4 text-[12px] font-medium">
    <li className="inline-flex items-center gap-1.5">
      <Dot color={MULHER_COLOR} />
      Mulheres
    </li>
    <li className="inline-flex items-center gap-1.5">
      <Dot color={HOMEM_COLOR} />
      Homens
    </li>
  </ul>
);

// Só o mouse prévia: toque não tem "passar por cima", e o clique já escolhe.
const mouseOnly = (event: PointerEvent<HTMLElement>, action: () => void) => {
  if (event.pointerType === "mouse") action();
};

// A faixa escolhida fica destacada; o mouse sobre outra só troca o cabeçalho.
const usePyramidBands = (rows: PyramidRow[]) => {
  const [picked, setPicked] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const selected =
    rows.find((row) => row.label === picked) ?? defaultBand(rows);
  const previewed = rows.find((row) => row.label === hovered) ?? selected;

  return {
    reading: previewed,
    selectedLabel: selected?.label ?? null,
    select: setPicked,
    hover: setHovered,
  };
};

const PyramidBody = ({ rows }: { rows: PyramidRow[] }) => {
  const bands = usePyramidBands(rows);

  return (
    <>
      {bands.reading ? <BandReader row={bands.reading} /> : null}
      <div className="flex flex-col gap-1.5 [--mxw:86%] max-[1000px]:[--mxw:78%] max-[700px]:[--mxw:60%]">
        {rows.map((row) => (
          <PyramidRowButton
            key={row.label}
            row={row}
            selected={row.label === bands.selectedLabel}
            onSelect={() => bands.select(row.label)}
            onHover={bands.hover}
          />
        ))}
      </div>
      <PyramidLegend />
    </>
  );
};

/**
 * Card "População por faixa etária e sexo": pirâmide em barras horizontais,
 * uma faixa por linha, com mulheres à esquerda e homens à direita. O cabeçalho
 * mostra a faixa escolhida ("30 a 39 anos" de início).
 *
 * @example <PerfilPiramideCard data={panel} place="Nordeste" state="ok" onRetry={retry} />
 */
export const PerfilPiramideCard = (props: PerfilCardProps) => {
  const { data, place } = props;
  const rows = pyramidRows(data.piramide);

  return (
    <ProtoCard
      title={TITLE}
      subtitle={`${place} · ${data.filters.ano}`}
      kind="rank"
      state={props.state}
      onRetry={props.onRetry}
      actions={
        <>
          <ProtoCardInfo title={TITLE} text={INFO} />
          <ProtoCardMenu title={TITLE} />
        </>
      }
    >
      <PyramidBody rows={rows} />
    </ProtoCard>
  );
};
