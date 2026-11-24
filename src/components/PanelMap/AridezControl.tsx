"use client";

import { FOCUS_RING } from "@/components/ProtoPanel/protoStyles";

export type AridezChoice = { on: boolean; year: number };

/**
 * Liga/desliga o raster do índice de aridez e escolhe a década (anos do
 * manifest). A década só vale com a camada ligada.
 *
 * @example <AridezControl years={[1990, 2020]} value={{ on: false, year: 2020 }} onChange={setAridez} />
 */
export const AridezControl = ({
  years,
  value,
  onChange,
}: {
  years: number[];
  value: AridezChoice;
  onChange: (choice: AridezChoice) => void;
}) => (
  <div className="flex items-center gap-2 rounded-[6px] border border-grey-300 bg-white px-2.5 py-1.5 text-xs leading-4 text-grey-1100 shadow-sm">
    <label className="inline-flex cursor-pointer items-center gap-1.5">
      <input
        type="checkbox"
        checked={value.on}
        onChange={(event) => onChange({ ...value, on: event.target.checked })}
        className={`size-3.5 accent-(--proto-accent) ${FOCUS_RING}`}
      />
      Índice de aridez
    </label>
    <select
      aria-label="Década do índice de aridez"
      value={value.year}
      disabled={!value.on}
      onChange={(event) =>
        onChange({ ...value, year: Number(event.target.value) })
      }
      className={`rounded-[4px] border border-grey-300 bg-white px-1 py-0.5 disabled:text-grey-500 ${FOCUS_RING}`}
    >
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  </div>
);
