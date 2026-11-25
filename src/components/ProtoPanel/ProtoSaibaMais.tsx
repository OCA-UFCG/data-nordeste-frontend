"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import {
  BUTTON_GHOST,
  PROTO_TEXT,
  protoToneStyle,
  type ProtoTone,
  WRAP,
} from "@/components/ProtoPanel/protoStyles";
import { cn } from "@/lib/utils";

export type ProtoGlossary = readonly (readonly [string, string])[];

const ThemeLink = ({
  href,
  className,
}: {
  href: string;
  className: string;
}) => (
  <Link href={href} className={cn(BUTTON_GHOST, className)}>
    Ver mais sobre o tema
    <ProtoIcon name="chevronRight" size={14} stroke={2.4} />
  </Link>
);

// Com glossário, o texto e o glossário dividem a linha; sem ele, o texto ocupa
// a largura toda.
const MoreText = ({
  id,
  expanded,
  paragraphs,
  glossary,
}: {
  id: string;
  expanded: boolean;
  paragraphs: string[];
  glossary?: ProtoGlossary;
}) => (
  <div
    id={id}
    aria-hidden={!expanded}
    className={`grid transition-[grid-template-rows] duration-250 motion-reduce:transition-none ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
  >
    <div className="overflow-hidden">
      <div
        className={
          glossary
            ? "grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 pt-4 max-[800px]:grid-cols-1 max-[800px]:gap-4"
            : "grid grid-cols-1 pt-4"
        }
      >
        <div>
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className={`mb-3 text-sm leading-[22px] ${glossary ? "max-w-[70ch]" : ""}`}
            >
              {paragraph}
            </p>
          ))}
        </div>
        {glossary ? <Glossary items={glossary} /> : null}
      </div>
    </div>
  </div>
);

const Glossary = ({ items }: { items: ProtoGlossary }) => (
  <div>
    <h3 className="mb-2 text-xs tracking-[0.07em] text-grey-800 uppercase">
      Glossário
    </h3>
    <dl className="grid gap-2.5">
      {items.map(([term, meaning]) => (
        <div key={term}>
          <dt className="text-sm font-semibold">{term}</dt>
          <dd className="text-[13px] text-grey-800">{meaning}</dd>
        </div>
      ))}
    </dl>
  </div>
);

/**
 * "Saiba mais" de um painel (`.more` do protótipo): resumo e "Ler mais" com o
 * glossário (quando há). O `tone` vai no `style` da seção, porque a página é do servidor.
 *
 * @example <ProtoSaibaMais tone="idh" title="Saiba mais" summary="…" paragraphs={["…"]} glossary={[["IDH", "…"]]} themeHref="/macrothemes/desenvolvimento-social" />
 */
export const ProtoSaibaMais = ({
  title,
  summary,
  paragraphs,
  glossary,
  themeHref,
  tone,
}: {
  title: string;
  summary: string;
  paragraphs: string[];
  glossary?: ProtoGlossary;
  themeHref: string | null;
  tone: ProtoTone;
}) => {
  const moreId = useId();
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      style={protoToneStyle(tone)}
      className={`${PROTO_TEXT} w-full bg-grey-200 py-8 max-[700px]:py-4`}
    >
      <div className={WRAP}>
        <div className="flex items-center justify-between gap-6">
          <h2 className="text-[28px] leading-9 font-semibold max-[700px]:text-xl max-[700px]:leading-7">
            {title}
          </h2>
          {themeHref ? (
            <ThemeLink
              href={themeHref}
              className="min-h-9 px-3 py-1 text-xs max-[700px]:hidden"
            />
          ) : null}
        </div>
        <div>
          <p className="mt-3 text-sm leading-6 max-[700px]:mt-2">{summary}</p>
          <MoreText
            id={moreId}
            expanded={expanded}
            paragraphs={paragraphs}
            glossary={glossary}
          />
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={moreId}
            onClick={() => setExpanded(!expanded)}
            className="mt-2 py-1.5 text-sm font-semibold text-green-900 underline underline-offset-3"
          >
            {expanded ? "Ler menos" : "Ler mais"}
          </button>
          {themeHref ? (
            <div className="hidden max-[700px]:block">
              <ThemeLink href={themeHref} className="mt-3" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
