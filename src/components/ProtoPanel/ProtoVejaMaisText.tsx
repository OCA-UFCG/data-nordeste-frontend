import { ProtoSkeleton } from "@/components/ProtoPanel/ProtoCard";
import { staleClass } from "@/components/ProtoPanel/protoStyles";
import type { PanelAnalysis } from "@/features/panels/panelAnalysis";
import type { PanelCardState } from "@/features/panels/panelCardState";

const NO_TEXT =
  "Não há texto disponível para a combinação de filtros selecionada.";
const ERROR_TEXT = "Não foi possível carregar o texto.";

/**
 * Identidade do texto, para saber se ele mudou entre dois renders.
 *
 * @example analysisKey(buildAridezAnalise(input)) !== analysisKey(anterior)
 */
export const analysisKey = (analysis: PanelAnalysis | null) =>
  analysis ? JSON.stringify(analysis) : null;

const AnalysisSkeleton = () => (
  <div aria-busy="true" aria-label="Carregando texto" className="flex flex-col">
    <ProtoSkeleton className="h-4 w-[55%]" />
    <ProtoSkeleton className="mt-2.5 h-3.5 w-full" />
    <ProtoSkeleton className="mt-1.5 h-3.5 w-[85%]" />
  </div>
);

// `.anl-tx ul` do protótipo: itens com a seta na cor do painel.
const AnalysisList = ({ items }: { items: string[] }) => (
  <ul>
    {items.map((item) => (
      <li
        key={item}
        className="relative mb-1 pl-[22px] text-base leading-6 text-grey-1100 before:absolute before:left-0 before:font-bold before:text-(--proto-accent-strong) before:content-['→']"
      >
        {item}
      </li>
    ))}
  </ul>
);

/**
 * Corpo do "Veja análise": esqueleto, erro, aviso de sem texto ou os blocos com
 * o rodapé. `flash` faz o texto novo brilhar (`anlFlash` do protótipo).
 *
 * @example <AnalysisText state="ok" analysis={analise} flash={false} />
 */
export const AnalysisText = ({
  state,
  analysis,
  flash,
}: {
  state: PanelCardState;
  analysis: PanelAnalysis | null;
  flash: boolean;
}) => {
  if (state === "loading") return <AnalysisSkeleton />;
  if (state === "error" || !analysis) {
    return (
      <p className="text-base leading-6 text-grey-800">
        {state === "error" ? ERROR_TEXT : NO_TEXT}
      </p>
    );
  }

  // `key`: cada texto novo remonta o bloco e reinicia o brilho.
  return (
    <div
      key={analysisKey(analysis)}
      className={`rounded-[4px] ${flash ? "animate-proto-flash motion-reduce:animate-none" : ""} ${staleClass(state === "stale")}`}
    >
      {analysis.blocks.map((block) => (
        <div key={block.title} className="mb-3.5 last:mb-0">
          <h4 className="mb-1 text-[15px] leading-[22px] font-bold text-grey-1100">
            {block.title}
          </h4>
          {block.text ? (
            <p className="text-base leading-6 text-grey-1100">{block.text}</p>
          ) : null}
          {block.items ? <AnalysisList items={block.items} /> : null}
        </div>
      ))}
      <p className="mt-3 text-[12.5px] leading-4 text-grey-800">
        {analysis.footnote}
      </p>
    </div>
  );
};
