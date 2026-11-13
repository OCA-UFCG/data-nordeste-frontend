"use client";

import { type MouseEvent, useState } from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ProtoSheet } from "@/components/ProtoPanel/ProtoSheet";
import {
  ICON_BUTTON,
  protoToneStyle,
} from "@/components/ProtoPanel/protoStyles";
import { useProtoTone } from "@/components/ProtoPanel/protoTone";
import { useMediaQuery } from "@/components/Panel/layout/useMediaQuery";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    <ProtoIcon name="info" size={20} stroke={1.8} />
  </button>
);

// No celular, o texto abre numa folha com o título do card.
const InfoSheetButton = ({ title, text }: { title: string; text: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <InfoButton onClick={() => setOpen(true)} />
      <ProtoSheet open={open} onOpenChange={setOpen} title={title}>
        <p className="text-[15px] leading-[22px] text-grey-1100">{text}</p>
      </ProtoSheet>
    </>
  );
};

// No desktop, passar o mouse mostra o balão e clicar o fixa até clicar fora,
// como no protótipo.
const InfoPopoverButton = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const tone = useProtoTone();
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
        style={protoToneStyle(tone)}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-auto max-w-[280px] rounded-[8px] border-grey-300 bg-white px-3 py-2.5 text-[13px] leading-[19px] text-grey-1100 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.3)]"
      >
        {text}
      </PopoverContent>
    </Popover>
  );
};

/**
 * Botão ⓘ de um card do painel: balão no desktop, folha no celular.
 *
 * @example <ProtoCardInfo title="Mapa do IDH por estado" text={IDH_CARD_INFO.map} />
 */
export const ProtoCardInfo = ({
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
