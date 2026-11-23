"use client";

import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import {
  FOCUS_RING,
  PROTO_TEXT,
  protoToneStyle,
  WRAP,
} from "@/components/ProtoPanel/protoStyles";
import { protoScrollBehavior } from "@/components/ProtoPanel/useProtoSticky";
import { IDH_VISOES, type IdhVisao } from "@/features/panels/idh/idhPanel";

const NEXT_KEYS: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

// Como no protótipo, as quatro setas andam na lista com volta; Home e End vão
// às pontas.
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

// Folga do protótipo ao trazer a aba aberta para a vista (`tbSc.scrollTo`).
const TAB_REVEAL_PAD = 56;

const useRevealActiveTab = (
  listRef: RefObject<HTMLDivElement | null>,
  active: IdhVisao,
) => {
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>("[aria-selected=true]");

    if (!list || !tab) return;
    const left = tab.offsetLeft - TAB_REVEAL_PAD;
    const right =
      tab.offsetLeft + tab.offsetWidth + TAB_REVEAL_PAD - list.clientWidth;
    const target = Math.min(Math.max(list.scrollLeft, right), left);

    if (target !== list.scrollLeft)
      list.scrollTo({
        left: Math.max(0, target),
        behavior: protoScrollBehavior(),
      });
  }, [listRef, active]);
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
    <ProtoIcon
      name={side === "left" ? "chevronLeft" : "chevronRight"}
      size={16}
      stroke={2.4}
    />
  </button>
);

const FADE =
  "pointer-events-none absolute inset-y-0 z-[2] w-9 transition-opacity duration-150";

/**
 * Barra de abas das visões (`.tabsbar` do protótipo), acima dos filtros e sem
 * grudar: rola com a página. Rola de lado quando não cabe, com esmaecimento e
 * setas nas pontas, e traz a aba aberta para a vista.
 *
 * @example <IdhViewBar idPrefix="idh-tab" panelId="idh-panel" active="geral" onSelect={setView} />
 */
export const IdhViewBar = (props: TabListProps) => {
  const { ref, overflow } = useHorizontalOverflow();
  const scroll = (direction: -1 | 1) =>
    ref.current?.scrollBy({
      left: direction * ref.current.clientWidth * 0.6,
      behavior: protoScrollBehavior(),
    });

  useRevealActiveTab(ref, props.active);

  return (
    <div
      style={protoToneStyle("idh")}
      className={`${PROTO_TEXT} relative z-[46] w-full border-b border-grey-300 bg-white`}
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
