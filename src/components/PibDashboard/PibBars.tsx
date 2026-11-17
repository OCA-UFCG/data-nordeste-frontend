import type { PibBarRow } from "@/features/panels/pib/pibBars";

// `.hb-row`: nome, barra e valor em três colunas; no celular, nome e valor em
// cima e a barra fina embaixo, sobre um trilho cinza.
const ROW_CLASS =
  "grid min-h-11 grid-cols-[minmax(90px,150px)_1fr_76px] items-center gap-3 max-[700px]:min-h-0 max-[700px]:grid-cols-[1fr_auto] max-[700px]:gap-x-2 max-[700px]:gap-y-1 max-[700px]:py-1.5 max-[700px]:[grid-template-areas:'n_v'_'t_t']";

const BarRow = ({
  row,
  color,
  formatValue,
}: {
  row: PibBarRow;
  color: string;
  formatValue: (value: number) => string;
}) => (
  <li className={ROW_CLASS}>
    <span className="text-right text-[11.5px] leading-[14px] max-[700px]:text-left max-[700px]:text-[13px] max-[700px]:leading-[17px] max-[700px]:[grid-area:n]">
      {row.label}
    </span>
    <span className="relative h-[22px] max-[700px]:h-2.5 max-[700px]:rounded-[6px] max-[700px]:bg-grey-200 max-[700px]:[grid-area:t]">
      <i
        className="absolute inset-y-0 left-0 rounded-r-[2px] max-[700px]:rounded-[6px]"
        style={{ width: `${(row.share * 100).toFixed(1)}%`, background: color }}
      />
    </span>
    <span className="text-[11.5px] whitespace-nowrap tabular-nums max-[700px]:text-[13px] max-[700px]:font-semibold max-[700px]:[grid-area:v]">
      {formatValue(row.value)}
    </span>
  </li>
);

// `.hb-ax`: as marcas do eixo, alinhadas com a coluna das barras. Some no
// celular, onde cada linha já traz o valor.
const BarAxis = ({
  ticks,
  formatTick,
}: {
  ticks: number[];
  formatTick: (value: number) => string;
}) => (
  <div
    aria-hidden="true"
    className="mt-1 grid grid-cols-[minmax(90px,150px)_1fr_76px] gap-3 text-[11px] text-grey-800 max-[700px]:hidden"
  >
    <span />
    <div className="flex justify-between tabular-nums">
      {ticks.map((tick) => (
        <span key={tick}>{formatTick(tick)}</span>
      ))}
    </div>
    <span />
  </div>
);

/**
 * Barras horizontais dos cards de setor do PIB (`.hb` do protótipo), em HTML:
 * uma linha por item, com o eixo embaixo. As larguras vêm prontas em
 * `rows[].share`.
 *
 * @example <PibBars rows={bars.rows} ticks={bars.ticks} color="#973815" formatValue={formatPibReais} formatTick={formatPibTick} />
 */
export const PibBars = ({
  rows,
  ticks,
  color,
  formatValue,
  formatTick,
}: {
  rows: PibBarRow[];
  ticks: number[];
  color: string;
  formatValue: (value: number) => string;
  formatTick: (value: number) => string;
}) => (
  <>
    <ul className="mt-1 flex flex-col gap-1">
      {rows.map((row) => (
        <BarRow
          key={row.label}
          row={row}
          color={color}
          formatValue={formatValue}
        />
      ))}
    </ul>
    <BarAxis ticks={ticks} formatTick={formatTick} />
  </>
);
