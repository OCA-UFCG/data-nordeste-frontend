"use client";

import { useState } from "react";
import {
  MENU_ACTION_CLASS,
  MenuLabel,
  MenuScreen,
  MenuStatus,
} from "@/components/IdhDashboard/menu/CardMenuParts";

// `path`: caminho e busca do painel (ex.: "/demo/idh?uf=PE"); `chips`: os
// filtros que entram no link, em texto.
export type CardShare = { path: string; chips: string[] };

const COPY_MESSAGES = {
  idle: "",
  copied: "Link copiado.",
  failed: "Não foi possível copiar. Selecione o link e copie.",
} as const;

// Só renderiza com o menu aberto, no navegador: `window` existe aqui.
const absoluteUrl = (path: string) =>
  new URL(path, window.location.origin).href;

const FilterChips = ({ chips }: { chips: string[] }) => (
  <>
    <MenuLabel>Filtros que entram no link</MenuLabel>
    <ul className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <li
          key={chip}
          className="rounded-full border border-[#ded9fb] bg-[#f6f4fe] px-2.5 py-0.5 text-xs font-semibold text-[#6d34cd]"
        >
          {chip}
        </li>
      ))}
    </ul>
  </>
);

/**
 * Tela "Compartilhar" do menu do card: os filtros que vão no link, o link e o
 * botão de copiar.
 *
 * @example <CardShareScreen share={{ path: "/demo/idh?uf=PE", chips: ["Estado: Pernambuco"] }} onBack={back} />
 */
export const CardShareScreen = ({
  share,
  onBack,
}: {
  share: CardShare;
  onBack: () => void;
}) => {
  const url = absoluteUrl(share.path);
  const [copy, setCopy] = useState<keyof typeof COPY_MESSAGES>("idle");

  // Dentro do then: fora de HTTPS `navigator.clipboard` não existe e o erro
  // sairia síncrono, sem passar pelo catch.
  const copyLink = () =>
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(url))
      .then(() => setCopy("copied"))
      .catch(() => setCopy("failed"));

  return (
    <MenuScreen title="Compartilhar" onBack={onBack}>
      <FilterChips chips={share.chips} />
      <MenuLabel>Link do gráfico</MenuLabel>
      <input
        readOnly
        value={url}
        aria-label="Link do gráfico"
        onFocus={(event) => event.currentTarget.select()}
        className="h-9 w-full min-w-0 rounded-[6px] border border-grey-300 bg-grey-100 px-2.5 text-[12.5px] text-grey-800"
      />
      <div className="h-2.5" />
      <button type="button" onClick={copyLink} className={MENU_ACTION_CLASS}>
        Copiar link
      </button>
      <MenuStatus message={COPY_MESSAGES[copy]} />
    </MenuScreen>
  );
};
