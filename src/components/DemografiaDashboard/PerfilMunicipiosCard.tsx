"use client";

import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import {
  populacaoPorMunicipio,
  type MunicipioPoint,
} from "@/features/panels/demografia/demografiaPanel";
import { formatPessoas } from "@/features/panels/format";

const TITLE = "População por município";
const TOP_COUNT = 15;

// A barra mais longa ocupa 46% da célula; o resto fica para o número.
const barWidth = (value: number, max: number): string =>
  max > 0 ? `${(value / max) * 46}%` : "0%";

const MunicipioRow = ({ item, max }: { item: MunicipioPoint; max: number }) => (
  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 text-[12px] max-[1000px]:grid-cols-[minmax(0,.9fr)_minmax(0,1fr)]">
    <span className="text-right leading-[1.2]">{item.label}</span>
    <div className="flex items-center gap-1.5">
      <i
        className="h-[14px] flex-none rounded-[2px] bg-[#e484aa]"
        style={{ width: barWidth(item.value, max) }}
      />
      <span className="text-[11.5px] tabular-nums whitespace-nowrap">
        {formatPessoas(item.value)}
      </span>
    </div>
  </div>
);

// Rola dentro do card; no celular a lista cresce e a página rola.
const MunicipiosList = ({ items }: { items: MunicipioPoint[] }) => {
  const max = items[0]?.value ?? 0;

  return (
    <div className="mun-list flex min-h-0 flex-[1_1_0] flex-col gap-1.5 overflow-auto pr-1.5 [scrollbar-width:thin] max-[1000px]:flex-none max-[1000px]:overflow-visible">
      {items.map((item) => (
        <MunicipioRow key={item.code} item={item} max={max} />
      ))}
    </div>
  );
};

/**
 * Card "População por município": os 15 municípios de maior população entre
 * os escolhidos no filtro (ou todos, sem filtro), com barras proporcionais.
 *
 * @example <PerfilMunicipiosCard data={panel} place="Semiárido · Pernambuco" state="ok" onRetry={retry} />
 */
export const PerfilMunicipiosCard = (props: PerfilCardProps) => {
  const { data, place } = props;
  const items = populacaoPorMunicipio(data.mapa, data.filters.mun).slice(
    0,
    TOP_COUNT,
  );

  return (
    <ProtoCard
      title={TITLE}
      subtitle={`${place} · ${data.filters.ano}`}
      kind="rank"
      state={props.state}
      onRetry={props.onRetry}
      bodyClassName="flex min-h-0 flex-col"
      actions={<ProtoCardMenu title={TITLE} />}
    >
      <MunicipiosList items={items} />
    </ProtoCard>
  );
};
