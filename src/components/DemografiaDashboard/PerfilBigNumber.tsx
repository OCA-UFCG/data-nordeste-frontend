import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import {
  ProtoStatCards,
  type ProtoStatCell,
} from "@/components/ProtoPanel/ProtoStatCards";
import type { DemografiaPanelData } from "@/features/panels/demografia/demografiaPanel";
import { formatPessoas } from "@/features/panels/format";
import {
  findPerfilPopulacao,
  perfilChangeTone,
} from "@/features/panels/demografia/perfilPopulacao";
import { formatYearChange } from "@/features/panels/yearChange";

// Chip do ícone no tom do perfil; o ProtoStatCards compartilhado não tem essa cor.
const ICON_CLASS = "bg-[#fbdde8] text-[#a8264f]";

/**
 * Número de destaque do perfil: a população do ano e a variação para o censo
 * anterior. A variação negativa aparece em vermelho.
 *
 * @example perfilBigNumbers(panel)[0].pill // { text: "+3,0% em relação a 2010", direction: "up" }
 */
export const perfilBigNumbers = (
  data: DemografiaPanelData,
): ProtoStatCell[] => {
  const populacao = findPerfilPopulacao(data);
  const change = populacao?.change ?? null;

  return [
    {
      icon: "users",
      label: "População residente",
      value: populacao ? formatPessoas(populacao.value) : null,
      caption: `em ${data.filters.ano}`,
      pill: change
        ? {
            text: formatYearChange(change),
            direction: perfilChangeTone(change),
          }
        : null,
    },
  ];
};

/**
 * Número de destaque do perfil (`.bn` do protótipo): um card só, sem carrossel.
 *
 * @example <PerfilBigNumber data={panel} state="ok" onRetry={retry} />
 */
export const PerfilBigNumber = ({
  data,
  state,
  onRetry,
}: {
  data: DemografiaPanelData;
  state: ProtoCardState;
  onRetry: () => void;
}) => (
  <ProtoStatCards
    variant="hero"
    iconClassName={ICON_CLASS}
    cells={perfilBigNumbers(data)}
    state={state}
    onRetry={onRetry}
  />
);
