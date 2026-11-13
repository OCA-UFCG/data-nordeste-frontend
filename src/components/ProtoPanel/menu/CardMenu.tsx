"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import {
  ProtoIcon,
  type ProtoIconName,
} from "@/components/ProtoPanel/ProtoIcon";
import { ProtoSheet } from "@/components/ProtoPanel/ProtoSheet";
import {
  ICON_BUTTON,
  protoToneStyle,
} from "@/components/ProtoPanel/protoStyles";
import {
  CardImageScreen,
  type CardImage,
} from "@/components/ProtoPanel/menu/CardImageScreen";
import {
  CardShareScreen,
  type CardShare,
} from "@/components/ProtoPanel/menu/CardShareScreen";
import { useProtoTone } from "@/components/ProtoPanel/protoTone";
import { useMediaQuery } from "@/components/Panel/layout/useMediaQuery";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type MenuScreenKey = "list" | "share" | "image";

// `.mi`: item do menu; maior no celular, onde o menu é uma folha.
const ITEM_CLASS =
  "flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left text-sm text-grey-1100 hover:not-disabled:bg-grey-100 focus-visible:bg-grey-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-grey-500 max-[700px]:px-2 max-[700px]:py-3.5 max-[700px]:text-base";

const ItemIcon = ({ name }: { name: ProtoIconName }) => (
  <ProtoIcon name={name} size={18} className="flex-none text-grey-800" />
);

const MenuItem = ({
  icon,
  onClick,
  children,
}: {
  icon: ProtoIconName;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button type="button" onClick={onClick} className={ITEM_CLASS}>
    <ItemIcon name={icon} />
    <span>{children}</span>
  </button>
);

// Sem página no catálogo, o item fica visível, desativado e diz por quê.
const CatalogItem = ({ href }: { href: string | null }) =>
  href ? (
    <Link href={href} className={ITEM_CLASS}>
      <ItemIcon name="external" />
      <span>Ver no catálogo de dados</span>
    </Link>
  ) : (
    <button type="button" disabled className={ITEM_CLASS}>
      <ItemIcon name="external" />
      <span>
        Ver no catálogo de dados
        <small className="mt-px block text-xs leading-4 text-grey-800">
          Este dado ainda não tem página no catálogo.
        </small>
      </span>
    </button>
  );

const MenuList = ({
  hasImage,
  catalogHref,
  onOpen,
}: {
  hasImage: boolean;
  catalogHref: string | null;
  onOpen: (screen: MenuScreenKey) => void;
}) => (
  <div className="flex flex-col">
    <MenuItem icon="share" onClick={() => onOpen("share")}>
      Compartilhar
    </MenuItem>
    {hasImage ? (
      <MenuItem icon="download" onClick={() => onOpen("image")}>
        Baixar imagem
      </MenuItem>
    ) : null}
    <div role="separator" className="mx-1 my-1.5 h-px bg-grey-300" />
    <CatalogItem href={catalogHref} />
  </div>
);

type CardMenuProps = {
  title: string;
  share: CardShare;
  catalogHref: string | null;
  image?: CardImage;
};

const MenuBody = ({
  screen,
  setScreen,
  ...props
}: CardMenuProps & {
  screen: MenuScreenKey;
  setScreen: (screen: MenuScreenKey) => void;
}) => {
  const back = () => setScreen("list");

  if (screen === "share")
    return <CardShareScreen share={props.share} onBack={back} />;
  if (screen === "image" && props.image) {
    return (
      <CardImageScreen title={props.title} image={props.image} onBack={back} />
    );
  }

  return (
    <MenuList
      hasImage={!!props.image}
      catalogHref={props.catalogHref}
      onOpen={setScreen}
    />
  );
};

const TriggerIcon = () => <ProtoIcon name="dots" size={20} stroke={1.8} />;

/**
 * Menu ⋯ de um card, como no protótipo dos painéis: compartilhar o link com
 * os filtros, baixar a imagem (gráficos em SVG) e abrir o catálogo. Popover no
 * desktop, folha no celular.
 *
 * @example <CardMenu title="Mapa do IDH por estado" share={{ path, chips }} catalogHref="/catalog?category=x" image={{ getSource, source }} />
 */
export const CardMenu = (props: CardMenuProps) => {
  const isPhone = useMediaQuery("(max-width: 700px)");
  const tone = useProtoTone();
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<MenuScreenKey>("list");
  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setScreen("list");
  };
  const label = `Mais opções: ${props.title}`;
  const body = <MenuBody {...props} screen={screen} setScreen={setScreen} />;

  if (isPhone) {
    return (
      <>
        <button
          type="button"
          aria-label={label}
          title="Mais opções"
          aria-haspopup="dialog"
          onClick={() => changeOpen(true)}
          className={ICON_BUTTON}
        >
          <TriggerIcon />
        </button>
        <ProtoSheet open={open} onOpenChange={changeOpen} title={props.title}>
          {body}
        </ProtoSheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        aria-label={label}
        title="Mais opções"
        className={ICON_BUTTON}
      >
        <TriggerIcon />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        style={protoToneStyle(tone)}
        className="w-[300px] rounded-[8px] border-grey-300 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.3)]"
      >
        {body}
      </PopoverContent>
    </Popover>
  );
};
