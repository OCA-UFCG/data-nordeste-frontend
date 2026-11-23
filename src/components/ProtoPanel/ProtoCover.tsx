import Link from "next/link";
import { ProtoBackLink } from "@/components/ProtoPanel/ProtoBackLink";
import {
  ProtoIcon,
  type ProtoIconName,
} from "@/components/ProtoPanel/ProtoIcon";
import {
  PROTO_TEXT,
  protoToneStyle,
  type ProtoTone,
  WRAP,
} from "@/components/ProtoPanel/protoStyles";
import { cn } from "@/lib/utils";

type CoverVariant = "dark" | "light";

// "light" (PIB): fundo cinza claro com borda inferior; "dark": os demais painéis.
const VARIANT: Record<
  CoverVariant,
  {
    section: string;
    crumb: string;
    separator: string;
    current: string;
    focus: string;
  }
> = {
  dark: {
    section: "bg-grey-1000 text-white",
    crumb: "text-white/75",
    separator: "text-white/70",
    current: "text-white",
    focus: "focus-visible:outline-white",
  },
  light: {
    section: "border-b border-grey-300 bg-grey-100 text-grey-1100",
    crumb: "text-grey-800",
    separator: "text-grey-800",
    current: "font-medium text-grey-1100",
    focus: "focus-visible:outline-(--proto-accent-strong)",
  },
};

const CRUMB_LINK =
  "text-inherit no-underline hover:underline focus-visible:outline-[2.5px] focus-visible:outline-offset-2";

// "14/05/25", como no protótipo. UTC: a data do Contentful vem à meia-noite
// UTC e, no fuso de Brasília, cairia no dia anterior.
const formatPublishedAt = (date: string) =>
  new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "UTC",
  });

const Separator = ({ variant }: { variant: CoverVariant }) => (
  <ProtoIcon
    name="chevronRight"
    size={16}
    stroke={2.4}
    className={VARIANT[variant].separator}
  />
);

const Breadcrumbs = ({
  title,
  variant,
}: {
  title: string;
  variant: CoverVariant;
}) => {
  const { crumb, current, focus } = VARIANT[variant];

  return (
    <nav aria-label="Você está em" className="max-[700px]:hidden">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        <li className={cn("inline-flex items-center gap-1", crumb)}>
          <Link href="/" className={cn(CRUMB_LINK, focus)}>
            Início
          </Link>
          <Separator variant={variant} />
        </li>
        <li className={cn("inline-flex items-center gap-1", crumb)}>
          <Link href="/explore" className={cn(CRUMB_LINK, focus)}>
            Explorar dados
          </Link>
          <Separator variant={variant} />
        </li>
        <li aria-current="page" className={current}>
          {title}
        </li>
      </ol>
    </nav>
  );
};

/**
 * Capa do painel (`.cover` do protótipo, em "Cinza Dados 800"): voltar,
 * trilha, data de publicação, macrotema, título e texto de abertura. É usada
 * pela página (servidor), então recebe o `tone` e o `icon` em vez de ler o
 * contexto. `variant="light"` troca o fundo escuro por cinza claro com borda
 * inferior (PIB).
 *
 * @example <ProtoCover tone="idh" icon="idh" title={IDH_TITLE} lead={IDH_LEAD} macroTheme="Desenvolvimento Social" publishedAt="2025-05-14" />
 */
export const ProtoCover = ({
  title,
  lead,
  macroTheme,
  publishedAt,
  icon,
  tone,
  variant = "dark",
}: {
  title: string;
  lead: string;
  macroTheme: string;
  publishedAt?: string;
  icon: ProtoIconName;
  tone: ProtoTone;
  variant?: CoverVariant;
}) => (
  <section
    style={protoToneStyle(tone)}
    className={cn(
      PROTO_TEXT,
      "relative w-full overflow-hidden",
      VARIANT[variant].section,
    )}
  >
    <div
      className={`${WRAP} relative pt-6 pb-[58px] max-[700px]:pt-4 max-[700px]:pb-6`}
    >
      <div className="mb-5 flex min-h-10 items-center gap-4">
        <ProtoBackLink className={VARIANT[variant].focus} />
        <Breadcrumbs title={title} variant={variant} />
        {publishedAt ? (
          <span className="ml-auto rounded-full border border-(--proto-accent-line) bg-(--proto-accent-soft) px-3 py-px text-xs leading-5 font-semibold whitespace-nowrap text-(--proto-accent-strong)">
            Publicado em: {formatPublishedAt(publishedAt)}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-[20px] leading-[30px] font-medium max-[700px]:text-base">
        <span className="grid size-11 flex-none place-items-center rounded-[6px] bg-(--proto-accent) text-white max-[700px]:size-9">
          <ProtoIcon name={icon} size={26} />
        </span>
        Painel de {macroTheme}
      </div>
      <h1 className="mt-4 text-[40px] leading-[48px] font-bold tracking-[-0.01em] max-[700px]:mt-3 max-[700px]:text-2xl max-[700px]:leading-8">
        {title}
      </h1>
      {/* 1136 px: os 120ch do protótipo na Inter dele (a do site tem outro "0"). */}
      <p className="mt-5 max-w-[1136px] text-[15px] leading-6 max-[700px]:mt-2 max-[700px]:text-sm max-[700px]:leading-[21px]">
        {lead}
      </p>
    </div>
  </section>
);
