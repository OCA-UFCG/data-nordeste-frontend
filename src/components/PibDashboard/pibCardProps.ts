import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import type { PibPanelData } from "@/features/panels/pib/pibPanel";

/**
 * O que cada card do painel do PIB recebe: os dados, o nome do território (já
 * formatado) e o estado de carregamento do card.
 *
 * @example <PibVabCard data={panel} place="Nordeste · Pernambuco" state="ok" onRetry={retry} onSelectYear={pickYear} />
 */
export type PibCardProps = {
  data: PibPanelData;
  place: string;
  state: ProtoCardState;
  onRetry: () => void;
};
