"use client";

import {
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ProtoSheet } from "@/components/ProtoPanel/ProtoSheet";
import { FOCUS_RING } from "@/components/ProtoPanel/protoStyles";
import { protoScrollBehavior } from "@/components/ProtoPanel/useProtoSticky";
import {
  AnalysisText,
  analysisKey,
} from "@/components/ProtoPanel/ProtoVejaMaisText";
import type { PanelAnalysis } from "@/features/panels/panelAnalysis";
import type { PanelCardState } from "@/features/panels/panelCardState";

const TITLE = "Veja análise";
const PHONE_QUERY = "(max-width: 700px)";

// Cartão (computador) ou folha inferior (celular), escolhido no clique.
type VejaMaisMode = "closed" | "card" | "sheet";

const FLOATING_SHADOW = "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]";

// Ponto vermelho do protótipo (`.anl-dot`): o texto mudou com o filtro
// enquanto o cartão estava fechado. Selo cheio no canto superior direito do
// botão (o `fixed` do botão é a referência do `absolute`), não ao lado do
// texto: inline, o anel branco sobre a cor do botão parecia um círculo vazado
// (pedido do time, 24/11/2026).
const UpdatedDot = () => (
  <i
    title="Texto atualizado"
    className="absolute top-0 right-3 size-3 rounded-full border-2 border-white bg-[#d93025]"
  />
);

// Esc fecha o cartão. A folha do celular já trata o Esc pelo diálogo do Radix.
const useCloseOnEscape = (active: boolean, close: () => void) => {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, close]);
};

// INTENTIONAL: com a página no topo, o cartão cobria Município e "Limpar
// filtros" (André, 24/11/2026). Ao abrir, rola só o bastante para a barra de
// filtros grudar sob o cabeçalho; o cartão cabe abaixo dela.
const stickFilterBar = () => {
  const bar = document.querySelector<HTMLElement>("[data-proto-filter-bar]");

  if (!bar) return;
  const gap =
    bar.getBoundingClientRect().top - parseFloat(getComputedStyle(bar).top);

  if (gap > 1) window.scrollBy({ top: gap, behavior: protoScrollBehavior() });
};

// Ponto e brilho: o que mudou desde a última vez que o texto foi aberto ou
// fechado, e se já houve alguma troca desde o carregamento.
const useAnalysisNews = (analysis: PanelAnalysis | null) => {
  const current = analysisKey(analysis);
  const [seen, setSeen] = useState(current);
  const [first] = useState(current);

  return {
    flash: current !== first,
    changedSinceSeen: current !== null && current !== seen,
    markSeen: () => setSeen(current),
  };
};

const FloatingButton = ({
  buttonRef,
  open,
  controls,
  updated,
  onClick,
}: {
  buttonRef: RefObject<HTMLButtonElement>;
  open: boolean;
  controls: string;
  updated: boolean;
  onClick: () => void;
}) => (
  <button
    ref={buttonRef}
    type="button"
    aria-expanded={open}
    aria-controls={controls}
    onClick={onClick}
    className={`fixed right-6 bottom-6 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-(--proto-accent-strong) px-5 text-[15px] leading-5 font-bold text-white hover:brightness-110 max-[700px]:right-4 max-[700px]:bottom-4 ${FLOATING_SHADOW} ${FOCUS_RING}`}
  >
    <ProtoIcon name="text" size={20} />
    {TITLE}
    {updated ? <UpdatedDot /> : null}
  </button>
);

const AnalysisCard = ({
  id,
  onClose,
  children,
}: {
  id: string;
  onClose: () => void;
  children: ReactNode;
}) => {
  const titleId = useId();

  return (
    <div
      id={id}
      role="dialog"
      aria-labelledby={titleId}
      className={`fixed right-6 bottom-[88px] z-40 flex max-h-[min(60vh,560px)] w-[400px] max-w-[calc(100vw-32px)] flex-col rounded-[12px] border border-grey-300 bg-white ${FLOATING_SHADOW}`}
    >
      <div className="flex items-center justify-between border-b border-grey-300 py-3 pr-3 pl-5">
        <h2
          id={titleId}
          className="text-lg leading-6 font-semibold text-grey-1100"
        >
          {TITLE}
        </h2>
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className={`grid size-10 place-items-center rounded-[6px] hover:bg-grey-100 ${FOCUS_RING}`}
        >
          <ProtoIcon name="close" size={20} stroke={2.2} />
        </button>
      </div>
      <div className="overflow-auto px-5 py-4">{children}</div>
    </div>
  );
};

/**
 * "Veja análise" de um painel: botão flutuante no canto inferior direito que
 * abre o texto gerado a partir dos filtros, num cartão (computador) ou na folha
 * inferior (celular). O botão ganha um ponto quando o texto mudou desde a
 * última leitura.
 *
 * INTENTIONAL: até 24/11/2026 era a barra expansível no topo do painel
 * (`.anl` do protótipo). O time preferiu a versão em botão flutuante, que o
 * protótipo também tinha; o cartão não é modal para a pessoa trocar os
 * filtros e ver o texto mudar com ele aberto.
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
  const cardId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<VejaMaisMode>("closed");
  const news = useAnalysisNews(analysis);
  const open = mode !== "closed";

  // Ao abrir e ao fechar: o texto que mudou com o cartão aberto já foi lido.
  const toggle = () => {
    news.markSeen();
    if (open) return setMode("closed");
    if (window.matchMedia(PHONE_QUERY).matches) return setMode("sheet");
    stickFilterBar();
    setMode("card");
  };

  const close = () => {
    news.markSeen();
    setMode("closed");
    buttonRef.current?.focus();
  };

  useCloseOnEscape(mode === "card", close);
  const text = (
    <AnalysisText state={state} analysis={analysis} flash={news.flash} />
  );

  return (
    <>
      <FloatingButton
        buttonRef={buttonRef}
        open={open}
        controls={cardId}
        updated={!open && state === "ok" && news.changedSinceSeen}
        onClick={toggle}
      />
      {mode === "card" ? (
        <AnalysisCard id={cardId} onClose={close}>
          {text}
        </AnalysisCard>
      ) : null}
      <ProtoSheet
        open={mode === "sheet"}
        onOpenChange={(next) => (next ? null : close())}
        title={TITLE}
      >
        {text}
      </ProtoSheet>
    </>
  );
};
