"use client";

import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { BUTTON_GHOST } from "@/components/ProtoPanel/protoStyles";
import { IDH_VISOES, type IdhVisao } from "@/features/panels/idh/idhPanel";
import { cn } from "@/lib/utils";

/**
 * Botão do fim da visão geral no celular (`#gotoSexo` do protótipo): troca de
 * visão e leva o foco para a aba nova, de onde quem usa teclado continua.
 *
 * @example <IdhNextViewButton visao="sexo" tabId="idh-tab-sexo" onSelect={selectTab} />
 */
export const IdhNextViewButton = ({
  visao,
  tabId,
  onSelect,
}: {
  visao: IdhVisao;
  tabId: string;
  onSelect: (visao: IdhVisao) => void;
}) => (
  <button
    type="button"
    onClick={() => {
      onSelect(visao);
      document.getElementById(tabId)?.focus({ preventScroll: true });
    }}
    className={cn(BUTTON_GHOST, "mt-4 hidden w-full max-[700px]:flex")}
  >
    Ir para a aba de {IDH_VISOES.find((item) => item.key === visao)?.label}
    <ProtoIcon name="forward" size={16} stroke={2.4} />
  </button>
);
