"use client";

import { useMemo } from "react";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import {
  populacaoPorMunicipio,
  type MunicipioPoint,
} from "@/features/panels/demografia/demografiaPanel";
import { formatPessoas } from "@/features/panels/format";
import { withYear } from "@/features/panels/territorialFilters";

const TITLE = "População por município";
const TOP_COUNT = 15;

// 4.5rem reservados ao número: a barra mais longa não o empurra para fora.
const barWidth = (value: number, max: number): string =>
  max > 0 ? `calc((100% - 4.5rem) * ${value / max})` : "0px";

// `contents`: as células entram na grade da lista, e a coluna dos nomes fica
// com a largura do nome mais longo, numa linha só.
const MunicipioRow = ({ item, max }: { item: MunicipioPoint; max: number }) => (
  <div className="contents text-[12px]">
    <span className="truncate text-right leading-[1.2]" title={item.label}>
      {item.label}
    </span>
    <div className="flex min-w-0 items-center gap-1.5">
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

// Linhas de até 2.25rem: 15 preenchem o card, poucas ficam no topo. No celular
// a lista cresce e a página rola.
const MunicipiosList = ({ items }: { items: MunicipioPoint[] }) => {
  const max = items[0]?.value ?? 0;

  return (
    <div className="mun-list grid min-h-0 flex-[1_1_0] auto-rows-[minmax(min-content,2.25rem)] grid-cols-[minmax(0,max-content)_minmax(7rem,1fr)] items-center gap-x-2 gap-y-1.5 overflow-auto pr-1.5 [scrollbar-width:thin] max-[1000px]:flex-none max-[1000px]:auto-rows-min max-[1000px]:overflow-visible">
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

  // PERF: o mapa tem ~1 800 municípios; sem o memo, cada render do dashboard
  // (o sticky ao rolar, a navegação) refazia a ordenação só para pegar 15.
  const items = useMemo(
    () =>
      populacaoPorMunicipio(data.mapa, data.filters.mun).slice(0, TOP_COUNT),
    [data.mapa, data.filters.mun],
  );

  return (
    <ProtoCard
      title={TITLE}
      subtitle={withYear(place, data.filters.ano)}
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
