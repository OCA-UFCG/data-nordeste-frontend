"use client";

import { useId, useState } from "react";
import { ProtoSkeleton } from "@/components/ProtoPanel/ProtoCard";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { CARD_SHADOW, staleClass } from "@/components/ProtoPanel/protoStyles";
import type { PanelAnalysis } from "@/features/panels/panelAnalysis";
import type { PanelCardState } from "@/features/panels/panelCardState";

const NO_TEXT =
  "Não há texto disponível para a combinação de filtros selecionada.";
const ERROR_TEXT = "Não foi possível carregar o texto.";

// Chave do texto mostrado, para saber se ele mudou desde a última leitura.
const analysisKey = (analysis: PanelAnalysis | null) =>
  analysis ? JSON.stringify(analysis) : null;

// Prévia da barra fechada (`.anl-pv`): o primeiro parágrafo, ou o aviso.
const previewOf = (state: PanelCardState, analysis: PanelAnalysis | null) => {
  if (state === "loading") return "Carregando texto…";
  if (state === "error") return ERROR_TEXT;

  return analysis?.blocks[0]?.text ?? "Sem texto para estes filtros";
};

const AnalysisSkeleton = () => (
  <div aria-busy="true" aria-label="Carregando texto" className="flex flex-col">
    <ProtoSkeleton className="h-4 w-[55%]" />
    <ProtoSkeleton className="mt-2.5 h-3.5 w-full" />
    <ProtoSkeleton className="mt-1.5 h-3.5 w-[85%]" />
  </div>
);

const AnalysisText = ({
  state,
  analysis,
}: {
  state: PanelCardState;
  analysis: PanelAnalysis | null;
}) => {
  if (state === "loading") return <AnalysisSkeleton />;
  if (state === "error" || !analysis) {
    return (
      <p className="text-base leading-6 text-grey-800">
        {state === "error" ? ERROR_TEXT : NO_TEXT}
      </p>
    );
  }

  return (
    <div className={`max-w-[78ch] ${staleClass(state === "stale")}`}>
      {analysis.blocks.map((block) => (
        <div key={block.title} className="mb-3.5 last:mb-0">
          <h4 className="mb-1 text-[15px] leading-[22px] font-bold text-grey-1100">
            {block.title}
          </h4>
          <p className="text-base leading-6 text-grey-1100">{block.text}</p>
        </div>
      ))}
      <p className="mt-3 text-[12.5px] leading-4 text-grey-800">
        {analysis.footnote}
      </p>
    </div>
  );
};

// Ponto vermelho do protótipo (`.anl-dot`): o texto mudou com o filtro
// enquanto a barra estava fechada.
const UpdatedDot = () => (
  <i
    title="Texto atualizado"
    className="ml-2 inline-block size-2 rounded-full bg-[#d93025] align-middle shadow-[0_0_0_2px_#fff]"
  />
);

/**
 * "Veja mais" de um painel (`.anl` do protótipo): barra expansível no topo do
 * painel com um texto gerado a partir dos filtros. Fechada, mostra a prévia do
 * primeiro parágrafo e um ponto quando o texto mudou desde a última leitura.
 *
 * INTENTIONAL: o protótipo também tem a versão em botão flutuante, alternada
 * pela faixa preta do topo, que só existe para o teste; o painel usa a barra.
 *
 * @example <ProtoVejaMais analysis={buildAridezAnalise(input)} state="ok" />
 */
export const ProtoVejaMais = ({
  analysis,
  state,
}: {
  analysis: PanelAnalysis | null;
  state: PanelCardState;
}) => {
  const bodyId = useId();
  const buttonId = useId();
  const current = analysisKey(analysis);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(current);
  const updated =
    !open && state === "ok" && current !== null && current !== seen;
  const toggle = () => {
    if (!open) setSeen(current);
    setOpen(!open);
  };

  return (
    <section
      aria-label="Veja mais"
      className={`rounded-[8px] border border-grey-300 bg-white ${CARD_SHADOW}`}
    >
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
        className="flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-[8px] px-5 py-4 text-left text-grey-1100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-1100 max-[700px]:gap-2.5 max-[700px]:p-4"
      >
        <span className="grid size-8 flex-none place-items-center rounded-[8px] bg-(--proto-accent-soft) text-(--proto-accent-strong)">
          <ProtoIcon name="text" size={20} />
        </span>
        <span className="flex-none text-[15px] leading-5 font-bold max-[700px]:flex-1">
          Veja mais
          {updated ? <UpdatedDot /> : null}
        </span>
        <span
          className={`min-w-0 flex-1 truncate text-sm leading-5 text-grey-800 max-[700px]:hidden ${open ? "invisible" : ""}`}
        >
          {previewOf(state, analysis)}
        </span>
        <span className="inline-flex flex-none items-center gap-1 text-sm font-semibold">
          {open ? "Recolher" : "Expandir"}
          <ProtoIcon
            name="chevronDown"
            size={18}
            stroke={2.2}
            className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      <div
        id={bodyId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className="px-5 pb-5 pl-16 max-[700px]:px-4"
      >
        <AnalysisText state={state} analysis={analysis} />
      </div>
    </section>
  );
};
