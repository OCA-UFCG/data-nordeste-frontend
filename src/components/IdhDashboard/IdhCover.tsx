import Link from "next/link";
import { IdhBackLink } from "@/components/IdhDashboard/IdhBackLink";
import { IdhIcon } from "@/components/IdhDashboard/IdhIcon";
import { IDH_TEXT, WRAP } from "@/components/IdhDashboard/idhStyles";
import { cn } from "@/lib/utils";

const CRUMB_LINK =
  "text-inherit no-underline hover:underline focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-white";

// "14/05/25", como no protótipo. UTC: a data do Contentful vem à meia-noite
// UTC e, no fuso de Brasília, cairia no dia anterior.
const formatPublishedAt = (date: string) =>
  new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "UTC",
  });

const Separator = () => (
  <IdhIcon
    name="chevronRight"
    size={16}
    stroke={2.4}
    className="text-white/70"
  />
);

const Breadcrumbs = ({ title }: { title: string }) => (
  <nav aria-label="Você está em" className="max-[700px]:hidden">
    <ol className="flex flex-wrap items-center gap-1 text-sm">
      <li className="inline-flex items-center gap-1 text-white/75">
        <Link href="/" className={CRUMB_LINK}>
          Início
        </Link>
        <Separator />
      </li>
      <li className="inline-flex items-center gap-1 text-white/75">
        <Link href="/explore" className={CRUMB_LINK}>
          Explorar dados
        </Link>
        <Separator />
      </li>
      <li aria-current="page" className="text-white">
        {title}
      </li>
    </ol>
  </nav>
);

/**
 * Capa do painel (`.cover` do protótipo, em "Cinza Dados 800"): voltar,
 * trilha, data de publicação, macrotema, título e texto de abertura.
 *
 * @example <IdhCover title={IDH_TITLE} lead={IDH_LEAD} macroTheme="Desenvolvimento Social" publishedAt="2025-05-14" />
 */
export const IdhCover = ({
  title,
  lead,
  macroTheme,
  publishedAt,
}: {
  title: string;
  lead: string;
  macroTheme: string;
  publishedAt?: string;
}) => (
  <section
    className={cn(
      IDH_TEXT,
      "relative w-full overflow-hidden bg-grey-1000 text-white",
    )}
  >
    <div
      className={`${WRAP} relative pt-6 pb-[58px] max-[700px]:pt-4 max-[700px]:pb-6`}
    >
      <div className="mb-5 flex min-h-10 items-center gap-4">
        <IdhBackLink />
        <Breadcrumbs title={title} />
        {publishedAt ? (
          <span className="ml-auto rounded-full border border-[#ded9fb] bg-[#f6f4fe] px-3 py-px text-xs leading-5 font-semibold whitespace-nowrap text-[#6d34cd]">
            Publicado em: {formatPublishedAt(publishedAt)}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-[20px] leading-[30px] font-medium max-[700px]:text-base">
        <span className="grid size-11 flex-none place-items-center rounded-[6px] bg-[#7c46e1] max-[700px]:size-9">
          <IdhIcon name="idh" size={26} />
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
