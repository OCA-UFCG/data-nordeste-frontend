import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import type { AridezPanelData } from "@/features/panels/aridez/aridezPanel";

/**
 * O que cada card do painel de aridez recebe: os dados, o nome do território
 * (já formatado) e o estado de carregamento do card.
 *
 * @example <AridezClassCard data={panel} place="Nordeste · Pernambuco" state="ok" onRetry={retry} />
 */
export type AridezCardProps = {
  data: AridezPanelData;
  place: string;
  state: ProtoCardState;
  onRetry: () => void;
};
