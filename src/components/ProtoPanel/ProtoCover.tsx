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

const CRUMB_LINK =
  "text-inherit no-underline hover:underline focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-(--proto-accent-strong)";

// "14/05/25", como no protótipo. UTC: a data do Contentful vem à meia-noite de
// Brasília (03:00 UTC); fixar o fuso mantém o dia em qualquer servidor.
const formatUpdatedAt = (date: string) =>
  new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "UTC",
  });

const Crumb = ({ href, label }: { href: string; label: string }) => (
  <li className="inline-flex items-center gap-1 text-grey-800">
    <Link href={href} className={CRUMB_LINK}>
      {label}
    </Link>
    <ProtoIcon
      name="chevronRight"
      size={16}
      stroke={2.4}
      className="text-grey-800"
    />
  </li>
);

const Breadcrumbs = ({ title }: { title: string }) => (
  <nav aria-label="Você está em" className="max-[700px]:hidden">
    <ol className="flex flex-wrap items-center gap-1 text-sm">
      <Crumb href="/" label="Início" />
      <Crumb href="/explore" label="Explorar dados" />
      <li aria-current="page" className="font-medium text-grey-1100">
        {title}
      </li>
    </ol>
  </nav>
);

/**
 * Capa do painel (`.cover` do protótipo, em "Cinza Dados 50"): voltar, trilha,
 * data de atualização, macrotema, título e texto de abertura. É usada pela
 * página (servidor), então recebe o `tone` e o `icon` em vez de ler o contexto.
 *
 * @example <ProtoCover tone="idh" icon="idh" title={IDH_TITLE} lead={IDH_LEAD} macroTheme="Desenvolvimento Social" updatedAt="2025-05-14" />
 */
export const ProtoCover = ({
  title,
  lead,
  macroTheme,
  updatedAt,
  icon,
  tone,
}: {
  title: string;
  lead: string;
  macroTheme: string;
  updatedAt?: string;
  icon: ProtoIconName;
  tone: ProtoTone;
}) => (
  <section
    style={protoToneStyle(tone)}
    className={cn(
      PROTO_TEXT,
      "relative w-full overflow-hidden border-b border-grey-300 bg-grey-100 text-grey-1100",
    )}
  >
    <div
      className={`${WRAP} relative pt-6 pb-[58px] max-[700px]:pt-4 max-[700px]:pb-6`}
    >
      <div className="mb-5 flex min-h-10 items-center gap-4">
        <ProtoBackLink />
        <Breadcrumbs title={title} />
        {updatedAt ? (
          <span className="ml-auto rounded-full border border-(--proto-accent-line) bg-(--proto-accent-soft) px-3 py-px text-xs leading-5 font-semibold whitespace-nowrap text-(--proto-accent-strong)">
            Atualizado em: {formatUpdatedAt(updatedAt)}
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
      {/* INTENTIONAL: sem max-w. O texto vai até a borda direita do selo
          "Atualizado em" (fim do WRAP); o limite de 1136 px do protótipo
          (120ch) quebrava a linha antes da coluna do selo (revisão 26/11/2026). */}
      <p className="mt-5 text-[15px] leading-6 max-[700px]:mt-2 max-[700px]:text-sm max-[700px]:leading-[21px]">
        {lead}
      </p>
    </div>
  </section>
);
