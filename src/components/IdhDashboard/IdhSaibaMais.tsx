"use client";

import Link from "next/link";
import { type MouseEvent, useId, useState } from "react";
import { IdhIcon } from "@/components/IdhDashboard/IdhIcon";
import {
  BUTTON_GHOST,
  IDH_TEXT,
  WRAP,
} from "@/components/IdhDashboard/idhStyles";
import { cn } from "@/lib/utils";

// Textos do "Saiba mais sobre o IDH" do protótipo dos painéis.
const SUMMARY =
  "O Índice de Desenvolvimento Humano (IDH) é um indicador criado pelo Programa das Nações Unidas para o Desenvolvimento (PNUD) para avaliar o desenvolvimento humano a partir de três dimensões: educação, longevidade e renda. Seu valor varia de 0 a 1, e quanto mais próximo de 1, maior o desenvolvimento humano.";

const PARAGRAPHS = [
  "Mais do que medir o desempenho econômico de um território, o IDH retrata as oportunidades para que as pessoas tenham uma vida longa, acesso ao conhecimento e condições adequadas de renda. Por isso é muito usado para comparar realidades sociais e acompanhar mudanças ao longo do tempo.",
  "O IDH ajustado à desigualdade considera as diferenças entre os grupos da população. Quanto menor a diferença entre o IDH e o IDH ajustado, menores as perdas associadas à desigualdade.",
];

const GLOSSARY = [
  ["IDH", "Educação, longevidade e renda em um só número, de 0 a 1."],
  [
    "IDH ajustado à desigualdade",
    "O IDH descontadas as diferenças entre grupos da população.",
  ],
  [
    "Índice de Gini",
    "Concentração de renda: 0 é igualdade total e 1 é desigualdade máxima.",
  ],
  ["Renda per capita", "Renda média por pessoa."],
  [
    "Rendimento médio dos ocupados",
    "Rendimento médio do trabalho de quem está ocupado.",
  ],
] as const;

const PHONE_QUERY = "(max-width: 700px)";

const ThemeLink = ({
  href,
  className,
}: {
  href: string;
  className: string;
}) => (
  <Link href={href} className={cn(BUTTON_GHOST, className)}>
    Ver mais sobre o tema
    <IdhIcon name="chevronRight" size={14} stroke={2.4} />
  </Link>
);

// "Ler mais": o resto do texto e o glossário abrem com a altura animada.
const MoreText = ({ id, expanded }: { id: string; expanded: boolean }) => (
  <div
    id={id}
    aria-hidden={!expanded}
    className={`grid transition-[grid-template-rows] duration-250 motion-reduce:transition-none ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
  >
    <div className="overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 pt-4 max-[800px]:grid-cols-1 max-[800px]:gap-4">
        <div>
          {PARAGRAPHS.map((paragraph) => (
            <p
              key={paragraph}
              className="mb-3 max-w-[70ch] text-sm leading-[22px]"
            >
              {paragraph}
            </p>
          ))}
        </div>
        <div>
          <h3 className="mb-2 text-xs tracking-[0.07em] text-grey-800 uppercase">
            Glossário
          </h3>
          <dl className="grid gap-2.5">
            {GLOSSARY.map(([term, meaning]) => (
              <div key={term}>
                <dt className="text-sm font-semibold">{term}</dt>
                <dd className="text-[13px] text-grey-800">{meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  </div>
);

/**
 * "Saiba mais sobre o IDH" (`.more` do protótipo): resumo, "Ler mais" com o
 * glossário e, no celular, uma sanfona fechada que abre pelo cabeçalho.
 *
 * @example <IdhSaibaMais themeHref="/macrothemes/desenvolvimento-social" />
 */
export const IdhSaibaMais = ({ themeHref }: { themeHref: string | null }) => {
  const bodyId = useId();
  const moreId = useId();
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);

  // No celular, tocar no cabeçalho (fora do link) abre e fecha a seção.
  const toggleOnPhone = (event: MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia(PHONE_QUERY).matches) return;
    if ((event.target as Element).closest("a")) return;
    setOpen(!open);
  };

  return (
    <section className={`${IDH_TEXT} w-full bg-grey-200 py-8 max-[700px]:py-4`}>
      <div className={WRAP}>
        <div
          onClick={toggleOnPhone}
          className="flex items-center justify-between gap-6 max-[700px]:cursor-pointer"
        >
          <h2 className="text-[28px] leading-9 font-semibold max-[700px]:text-xl max-[700px]:leading-7">
            Saiba mais sobre o IDH
          </h2>
          {themeHref ? (
            <ThemeLink
              href={themeHref}
              className="min-h-9 px-3 py-1 text-xs max-[700px]:hidden"
            />
          ) : null}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label="Expandir Saiba mais"
            className="hidden size-8 place-items-center max-[700px]:grid"
          >
            <IdhIcon
              name="chevronDown"
              size={22}
              stroke={2.4}
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        <div id={bodyId} className={open ? "" : "max-[700px]:hidden"}>
          <p className="mt-3 text-sm leading-6 max-[700px]:mt-2">{SUMMARY}</p>
          <MoreText id={moreId} expanded={expanded} />
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
