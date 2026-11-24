"use client";

import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import {
  ProtoStatCards,
  type ProtoStatCell,
} from "@/components/ProtoPanel/ProtoStatCards";
import {
  buildPibBigNumbers,
  describePibCaption,
} from "@/features/panels/pib/pibBigNumbers";
import { formatPibReais } from "@/features/panels/pib/pibFormat";
import type { PibPanelData } from "@/features/panels/pib/pibPanel";

// `.pib .bn .ico`: chip redondo, em laranja mais forte que o tom do painel.
const ICON_CLASS =
  "rounded-full bg-(--proto-accent-chip) text-(--proto-accent-strong)";

const ICONS = { pib: "usd", perCapita: "renda" } as const;

/**
 * Os dois números de destaque do PIB em células do `ProtoStatCards`: as
 * regras ficam em `buildPibBigNumbers`; aqui só o ícone, a legenda e o formato.
 *
 * @example pibBigNumbers(panel)[0].value // "R$ 1,51 Tri"
 */
const pibBigNumbers = (data: PibPanelData): ProtoStatCell[] => {
  const caption = describePibCaption(data);

  return buildPibBigNumbers(data.serie, data.filters.ano).map((cell) => ({
    icon: ICONS[cell.key],
    label: cell.label,
    caption,
    value: cell.value === null ? null : formatPibReais(cell.value),
    pill: cell.pill,
  }));
};

/**
 * Números de destaque do PIB (`.pib .bns` do protótipo): dois cards lado a
 * lado, em carrossel no celular.
 *
 * @example <PibBigNumbers data={panel} state="ok" onRetry={retry} />
 */
export const PibBigNumbers = ({
  data,
  state,
  onRetry,
}: {
  data: PibPanelData;
  state: ProtoCardState;
  onRetry: () => void;
}) => (
  <ProtoStatCards
    label="Números do PIB"
    variant="pair"
    withPill
    iconClassName={ICON_CLASS}
    cells={pibBigNumbers(data)}
    state={state}
    onRetry={onRetry}
  />
);
