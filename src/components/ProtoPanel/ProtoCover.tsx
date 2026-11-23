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

// `dark`: "Cinza Dados 800" com texto branco (PIB e perfil). `light`: o
// "Cinza Dados 50" (#F8F7F8) com texto escuro (IDH).
const COVER_LOOK = {
  dark: {
    section: "bg-grey-1000 text-white",
    crumb: "text-white/75",
    current: "text-white",
    separator: "text-white/70",
    focus: "focus-visible:outline-white",
  },
  light: {
    section: "border-b border-grey-300 bg-grey-100 text-grey-1100",
    crumb: "text-grey-800",
    current: "font-medium text-grey-1100",
    separator: "text-grey-800",
    focus: "focus-visible:outline-(--proto-accent-strong)",
  },
} as const;

type CoverLook = (typeof COVER_LOOK)[keyof typeof COVER_LOOK];

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

const Crumb = ({
  href,
  label,
  look,
}: {
  href: string;
  label: string;
  look: CoverLook;
}) => (
  <li className={`inline-flex items-center gap-1 ${look.crumb}`}>
    <Link href={href} className={`${CRUMB_LINK} ${look.focus}`}>
      {label}
    </Link>
    <ProtoIcon
      name="chevronRight"
      size={16}
      stroke={2.4}
      className={look.separator}
    />
  </li>
);

const Breadcrumbs = ({ title, look }: { title: string; look: CoverLook }) => (
  <nav aria-label="Você está em" className="max-[700px]:hidden">
    <ol className="flex flex-wrap items-center gap-1 text-sm">
      <Crumb href="/" label="Início" look={look} />
      <Crumb href="/explore" label="Explorar dados" look={look} />
      <li aria-current="page" className={look.current}>
        {title}
      </li>
    </ol>
  </nav>
);

/**
 * Capa do painel (`.cover` do protótipo, em "Cinza Dados 800" ou, com `light`,
 * "Cinza Dados 50"): voltar, trilha, data de publicação, macrotema, título e
 * texto de abertura. É usada pela página (servidor), então recebe o `tone` e o
 * `icon` em vez de ler o contexto.
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
  light = false,
}: {
  title: string;
  lead: string;
  macroTheme: string;
  publishedAt?: string;
  icon: ProtoIconName;
  tone: ProtoTone;
  light?: boolean;
}) => {
  const look = COVER_LOOK[light ? "light" : "dark"];

  return (
    <section
      style={protoToneStyle(tone)}
      className={cn(
        PROTO_TEXT,
        "relative w-full overflow-hidden",
        look.section,
      )}
    >
      <div
        className={`${WRAP} relative pt-6 pb-[58px] max-[700px]:pt-4 max-[700px]:pb-6`}
      >
        <div className="mb-5 flex min-h-10 items-center gap-4">
          <ProtoBackLink focusClassName={look.focus} />
          <Breadcrumbs title={title} look={look} />
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
};
