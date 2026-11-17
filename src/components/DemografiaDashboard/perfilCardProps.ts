import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import type { DemografiaPanelData } from "@/features/panels/demografia/demografiaPanel";

/**
 * O que cada card do perfil demográfico recebe da página: os dados do painel,
 * o nome do território (já formatado) e o estado de carregamento do card.
 *
 * @example <PerfilSexoCard data={panel} place="Nordeste" state="ok" onRetry={retry} />
 */
export type PerfilCardProps = {
  data: DemografiaPanelData;
  place: string;
  state: ProtoCardState;
  onRetry: () => void;
};
