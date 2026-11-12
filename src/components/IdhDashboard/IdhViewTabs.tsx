"use client";

import {
  type KeyboardEvent,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { IdhIcon } from "@/components/IdhDashboard/IdhIcon";
import {
  FOCUS_RING,
  IDH_TEXT,
  WRAP,
} from "@/components/IdhDashboard/idhStyles";
import { IDH_VISOES, type IdhVisao } from "@/features/panels/idh/idhPanel";

const NEXT_KEYS: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

// Como no protótipo, as quatro setas andam nas duas listas; Home e End vão às
// pontas.
const nextVisao = (key: string, current: IdhVisao): IdhVisao | null => {
  const index = IDH_VISOES.findIndex((item) => item.key === current);
  const total = IDH_VISOES.length;

  if (key === "Home") return IDH_VISOES[0].key;
  if (key === "End") return IDH_VISOES[total - 1].key;
  if (!(key in NEXT_KEYS)) return null;

  return IDH_VISOES[(index + NEXT_KEYS[key] + total) % total].key;
};

type TabListProps = {
  idPrefix: string;
  panelId: string;
  active: IdhVisao;
  onSelect: (visao: IdhVisao) => void;
};

const tabKeyHandler =
  ({ idPrefix, active, onSelect }: TabListProps) =>
  (event: KeyboardEvent<HTMLDivElement>) => {
    const next = nextVisao(event.key, active);

    if (!next) return;
    event.preventDefault();
    onSelect(next);
    document.getElementById(`${idPrefix}-${next}`)?.focus();
  };

const Tabs = ({
  idPrefix,
  panelId,
  active,
  onSelect,
  className,
}: TabListProps & { className: string }) =>
  IDH_VISOES.map((visao) => (
    <button
      key={visao.key}
      type="button"
      role="tab"
      id={`${idPrefix}-${visao.key}`}
      aria-selected={visao.key === active}
      aria-controls={panelId}
      tabIndex={visao.key === active ? 0 : -1}
      onClick={() => onSelect(visao.key)}
      className={`${className} ${FOCUS_RING}`}
    >
      {visao.label}
    </button>
  ));

/**
 * Coluna lateral das visões (`.rail` do protótipo), acima de 900 px. O fundo
 * cinza vai até a borda esquerda da tela.
 *
 * @example <IdhViewRail idPrefix="idh-rail" panelId="idh-panel" active="geral" onSelect={setView} top={196} />
 */
export const IdhViewRail = (props: TabListProps & { top: number }) => (
  <aside className="relative bg-grey-100 before:absolute before:inset-y-0 before:right-full before:w-screen before:bg-grey-100 max-[900px]:hidden">
    <div
      role="tablist"
      aria-label="Visões do painel"
      aria-orientation="vertical"
      onKeyDown={tabKeyHandler(props)}
      style={{ top: props.top }}
      className="sticky flex flex-col gap-2 pt-8 pr-4 pb-8 pl-10"
    >
      <Tabs
        {...props}
        className="rounded-[6px] px-3 py-2.5 text-left text-sm leading-[22px] hover:bg-grey-200 aria-selected:bg-green-800 aria-selected:font-bold aria-selected:text-white"
      />
    </div>
  </aside>
);

type Overflow = { left: boolean; right: boolean; any: boolean };

const useHorizontalOverflow = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState<Overflow>({
    left: false,
    right: false,
    any: false,
  });
  const update = useCallback(() => {
    const element = ref.current;

    if (!element) return;
    const max = element.scrollWidth - element.clientWidth;

    setOverflow({
      left: element.scrollLeft > 2,
      right: element.scrollLeft < max - 2,
      any: max > 2,
    });
  }, []);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;
    const observer = new ResizeObserver(update);

    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });

    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [update]);

  return { ref, overflow };
};

const ScrollArrow = ({
  side,
  visible,
  onClick,
}: {
  side: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    tabIndex={-1}
    aria-label={side === "left" ? "Ver abas anteriores" : "Ver mais abas"}
    onClick={onClick}
    className={`absolute top-1/2 z-[3] hidden size-[30px] -translate-y-1/2 place-items-center rounded-full border border-grey-300 bg-white p-0 text-grey-1100 shadow-[0_2px_6px_-2px_rgba(0,0,0,0.25)] hover:bg-grey-100 ${side === "left" ? "left-0.5" : "right-0.5"} ${visible ? "pointer-fine:grid" : ""}`}
  >
    <IdhIcon
      name={side === "left" ? "chevronLeft" : "chevronRight"}
      size={16}
      stroke={2.4}
    />
  </button>
);

const FADE =
  "pointer-events-none absolute inset-y-0 z-[2] w-9 transition-opacity duration-150";

/**
 * Barra de abas das visões (`.tabsbar` do protótipo), até 900 px: rola de
 * lado quando não cabe, com esmaecimento e setas nas pontas.
 *
 * @example <IdhViewBar idPrefix="idh-tab" panelId="idh-panel" active="geral" onSelect={setView} top={80} barRef={ref} />
 */
export const IdhViewBar = ({
  top,
  barRef,
  ...props
}: TabListProps & { top: number; barRef: Ref<HTMLDivElement> }) => {
  const { ref, overflow } = useHorizontalOverflow();
  const scroll = (direction: -1 | 1) =>
    ref.current?.scrollBy({
      left: direction * ref.current.clientWidth * 0.6,
      behavior: "smooth",
    });

  return (
    <div
      ref={barRef}
      style={{ top }}
      className={`${IDH_TEXT} sticky z-[46] hidden w-full border-b border-grey-300 bg-white max-[900px]:block max-[700px]:static`}
    >
      <div className={`${WRAP} relative flex items-center`}>
        <span
          className={`${FADE} left-0 bg-[linear-gradient(90deg,#fff_25%,rgba(255,255,255,0))] ${overflow.left ? "opacity-100" : "opacity-0"}`}
        />
        <ScrollArrow
          side="left"
          visible={overflow.any && overflow.left}
          onClick={() => scroll(-1)}
        />
        <div
          ref={ref}
          role="tablist"
          aria-label="Visões do painel"
          onKeyDown={tabKeyHandler(props)}
          className="relative flex min-w-0 flex-1 snap-x snap-proximity scroll-px-10 gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Tabs
            {...props}
            className="flex-none snap-center rounded-none border-b-[3px] border-transparent px-3.5 pt-3.5 pb-[11px] text-sm leading-5 font-medium whitespace-nowrap text-grey-800 hover:bg-grey-100 hover:text-grey-1100 aria-selected:border-green-800 aria-selected:font-bold aria-selected:text-grey-1100 max-[700px]:px-3 max-[700px]:text-[15px]"
          />
        </div>
        <ScrollArrow
          side="right"
          visible={overflow.any && overflow.right}
          onClick={() => scroll(1)}
        />
        <span
          className={`${FADE} right-0 bg-[linear-gradient(270deg,#fff_25%,rgba(255,255,255,0))] ${overflow.right ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </div>
  );
};
