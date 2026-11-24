"use client";

import type {
  GeodataStyles,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import { NO_DATA_COLOR } from "@/features/panelMap/qgisPaint";

type LegendEntry = { key: string; label: string; color: string };

const LegendList = ({
  title,
  entries,
}: {
  title: string;
  entries: LegendEntry[];
}) => (
  <div>
    <p className="mb-1 font-semibold text-grey-1100">{title}</p>
    <ul className="space-y-0.5">
      {entries.map((entry) => (
        <li key={entry.key} className="flex items-center gap-1.5">
          <i
            aria-hidden
            className="inline-block size-2.5 shrink-0 rounded-[2px] border border-black/10"
            style={{ background: entry.color }}
          />
          <span>{entry.label}</span>
        </li>
      ))}
    </ul>
  </div>
);

function indicatorEntries(
  styles: GeodataStyles,
  indicator: PanelIndicator,
): LegendEntry[] {
  const classes = styles.indicators[indicator].classes.map((item, index) => ({
    key: `class-${index}`,
    label: item.label,
    color: item.color,
  }));

  return [
    ...classes,
    { key: "no-data", label: "Sem dado", color: NO_DATA_COLOR },
  ];
}

function aridezEntries(styles: GeodataStyles): LegendEntry[] {
  return styles.aridez.map((item) => ({
    key: `aridez-${item.value}`,
    label: item.label,
    color: item.color,
  }));
}

/**
 * Legenda do mapa: as classes do `.qgz` do indicador, como vieram, e — com a
 * aridez ligada — também a paleta do índice de aridez da década escolhida.
 *
 * @example <PanelMapLegend styles={styles} indicator="pib" label="PIB" aridezYear={null} />
 */
export const PanelMapLegend = ({
  styles,
  indicator,
  label,
  aridezYear,
}: {
  styles: GeodataStyles;
  indicator: PanelIndicator;
  label: string;
  aridezYear: number | null;
}) => (
  <div className="max-w-56 space-y-2 rounded-[6px] border border-grey-300 bg-white/95 px-2.5 py-2 text-[11px] leading-4 text-grey-800 shadow-sm">
    <LegendList title={label} entries={indicatorEntries(styles, indicator)} />
    {aridezYear === null ? null : (
      <LegendList
        title={`Índice de aridez (${aridezYear})`}
        entries={aridezEntries(styles)}
      />
    )}
  </div>
);
