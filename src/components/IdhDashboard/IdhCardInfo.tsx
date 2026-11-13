"use client";

import { type MouseEvent, useState } from "react";
import { IdhIcon } from "@/components/IdhDashboard/IdhIcon";
import { IdhSheet } from "@/components/IdhDashboard/IdhSheet";
import { ICON_BUTTON } from "@/components/IdhDashboard/idhStyles";
import { useMediaQuery } from "@/components/Panel/layout/useMediaQuery";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Textos do ⓘ de cada card, do protótipo. Diferem dele num ponto: no banco há
// série anual por estado, então a linha não é sempre a média do Nordeste.
export const IDH_CARD_INFO = {
  evolution:
    "Média dos estados do Nordeste ou, com um estado no filtro, a série desse estado, de 2012 a 2021. O IDH ajustado à desigualdade desconta as diferenças entre grupos da população. Clique em um ponto para escolher o ano.",
  map: "Cada estado recebe a cor da sua faixa de desenvolvimento humano. Clique em um estado para usá-lo como filtro do painel.",
  ranking:
    "Estados ordenados do maior para o menor IDH, na cor da faixa. As barras vão de 0 a 1. Clique em uma barra para filtrar o painel.",
  groups:
    "Compara os dois grupos no local e no ano escolhidos. O tamanho da barra segue a escala indicada abaixo dela.",
} as const;

const INFO_LABEL = "Sobre este gráfico";

const InfoButton = (props: {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => (
  <button
    type="button"
    aria-label={INFO_LABEL}
    title={INFO_LABEL}
    className={ICON_BUTTON}
    {...props}
  >
    <IdhIcon name="info" size={20} stroke={1.8} />
  </button>
);

// No celular, o texto abre numa folha com o título do card.
const InfoSheetButton = ({ title, text }: { title: string; text: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <InfoButton onClick={() => setOpen(true)} />
      <IdhSheet open={open} onOpenChange={setOpen} title={title}>
        <p className="text-[15px] leading-[22px] text-grey-1100">{text}</p>
      </IdhSheet>
    </>
  );
};

// No desktop, passar o mouse mostra o balão e clicar o fixa até clicar fora,
// como no protótipo.
const InfoPopoverButton = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const togglePin = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setPinned(!pinned);
    setOpen(!pinned);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPinned(false);
      }}
    >
      <PopoverTrigger asChild>
        <InfoButton
          onClick={togglePin}
          onMouseEnter={() => pinned || setOpen(true)}
          onMouseLeave={() => pinned || setOpen(false)}
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-auto max-w-[280px] rounded-[8px] border-grey-300 bg-white px-3 py-2.5 text-[13px] leading-[19px] text-grey-1100 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.3)]"
      >
        {text}
      </PopoverContent>
    </Popover>
  );
};

/**
 * Botão ⓘ de um card do painel de IDH: balão no desktop, folha no celular.
 *
 * @example <IdhCardInfo title="Mapa do IDH por estado" text={IDH_CARD_INFO.map} />
 */
export const IdhCardInfo = ({
  title,
  text,
}: {
  title: string;
  text: string;
}) =>
  useMediaQuery("(max-width: 700px)") ? (
    <InfoSheetButton title={title} text={text} />
  ) : (
    <InfoPopoverButton text={text} />
  );
