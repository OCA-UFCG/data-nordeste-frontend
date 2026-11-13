"use client";

import { FOCUS_RING } from "@/components/IdhDashboard/idhStyles";
import type { IdhRankedState } from "@/features/panels/idh/idhClasses";
import { formatIdh } from "@/features/panels/idh/idhFormat";

// `.rk-row`: nome | barra | valor. No celular, nome e valor em cima e a barra
// embaixo, sempre roxa; do 1001 px para cima as linhas crescem até a altura
// do mapa ao lado.
const ROW_CLASS = `relative grid h-[67px] w-full grid-cols-[128px_1fr_52px] items-center gap-3 rounded-[6px] text-left hover:bg-grey-100 aria-pressed:bg-[#f6f4fe] aria-pressed:shadow-[inset_0_0_0_1.5px_#7c46e1] min-[1001px]:h-auto min-[1001px]:min-h-11 min-[1001px]:flex-1 max-[700px]:h-auto max-[700px]:grid-cols-[1fr_auto] max-[700px]:gap-x-2 max-[700px]:gap-y-1 max-[700px]:px-1.5 max-[700px]:pt-2 max-[700px]:pb-2.5 max-[700px]:[grid-template-areas:'n_v'_'t_t'] ${FOCUS_RING}`;

const AXIS_TICKS = ["0", "0,25", "0,50", "0,75", "1,00"];

const RankRow = ({
  state,
  selected,
  onSelect,
}: {
  state: IdhRankedState;
  selected: boolean;
  onSelect: (code: string) => void;
}) => (
  <button
    type="button"
    aria-pressed={selected}
    title={`${state.label}: ${formatIdh(state.value)}`}
    onClick={() => onSelect(state.code)}
    className={ROW_CLASS}
  >
    <span className="text-right text-[11.5px] leading-[14px] max-[700px]:text-left max-[700px]:text-sm max-[700px]:[grid-area:n]">
      {state.label}
    </span>
    <span className="relative h-7 max-[700px]:h-3 max-[700px]:overflow-hidden max-[700px]:rounded-[6px] max-[700px]:bg-grey-200 max-[700px]:[grid-area:t]">
      <i
        className="absolute inset-y-0 left-0 max-[700px]:rounded-[6px] max-[700px]:bg-[#6d34cd]!"
        style={{ width: `${state.value * 100}%`, background: state.color }}
      />
    </span>
    <span className="text-[11.5px] tabular-nums max-[700px]:text-sm max-[700px]:font-bold max-[700px]:[grid-area:v]">
      {formatIdh(state.value)}
    </span>
  </button>
);

/**
 * Ranking do IDH por estado (`.rk` do protótipo): barras de 0 a 1 na cor da
 * faixa. Clicar numa linha filtra pelo estado; clicar de novo desfaz.
 *
 * @example <IdhRankingBars states={rankIdhStates(panel.mapa)} selectedUf="PE" onSelect={toggleUf} />
 */
export const IdhRankingBars = ({
  states,
  selectedUf,
  onSelect,
}: {
  states: IdhRankedState[];
  selectedUf?: string;
  onSelect: (code: string) => void;
}) => (
  <>
    <div className="flex flex-col min-[1001px]:flex-1">
      {states.map((state) => (
        <RankRow
          key={state.code}
          state={state}
          selected={state.code === selectedUf}
          onSelect={onSelect}
        />
      ))}
    </div>
    <div
      aria-hidden="true"
      className="mt-1.5 grid grid-cols-[128px_1fr_52px] gap-3 text-[11px] text-grey-800 max-[700px]:hidden"
    >
      <span />
      <div className="flex justify-between tabular-nums">
        {AXIS_TICKS.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <span />
    </div>
  </>
);
