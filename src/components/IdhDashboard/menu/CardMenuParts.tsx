import type { ReactNode } from "react";
import { IdhIcon } from "@/components/IdhDashboard/IdhIcon";
import {
  BUTTON,
  ICON_BUTTON,
  SMALL_LABEL,
} from "@/components/IdhDashboard/idhStyles";

// `.mp .btn`: botão principal das telas do menu, na largura toda.
export const MENU_ACTION_CLASS = `${BUTTON} mt-1 w-full`;

// `.lab`: rótulo de cada bloco da tela.
export const MenuLabel = ({ children }: { children: ReactNode }) => (
  <span className={`${SMALL_LABEL} mt-2.5 mb-1.5 block`}>{children}</span>
);

/**
 * Tela do menu do card (`.mp-h` + `.mp` do protótipo): título com o botão de
 * voltar à lista e o conteúdo.
 *
 * @example <MenuScreen title="Compartilhar" onBack={() => setView("list")}>…</MenuScreen>
 */
export const MenuScreen = ({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 px-1 pt-1 pb-2 text-[15px] font-semibold text-grey-1100">
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar"
        className={ICON_BUTTON}
      >
        <IdhIcon name="back" size={18} />
      </button>
      {title}
    </div>
    <div className="px-2 pt-0.5 pb-2">{children}</div>
  </div>
);

// `.mst`: resultado (link copiado, imagem baixada), lido por leitor de tela.
export const MenuStatus = ({ message }: { message: string }) => (
  <p role="status" className="mt-2 min-h-[18px] text-[12.5px] text-green-900">
    {message}
  </p>
);
