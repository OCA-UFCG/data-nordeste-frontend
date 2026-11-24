"use client";

import type { FeatureCollection } from "geojson";
import {
  type PointerEvent,
  useEffect,
  useId,
  useMemo,
  useReducer,
} from "react";

import { previewOnMouse } from "@/components/Panel/pointer";

import {
  countByClass,
  type LegendChip as LegendChipData,
  paletteChips,
} from "@/features/panelMap/classCounts";
import {
  activeChip,
  type ChipHighlightAction,
  chipHighlightReducer,
  NO_CHIP_HIGHLIGHT,
} from "@/features/panelMap/chipHighlightState";
import {
  chipHighlightFilter,
  type LegendHighlightSource,
} from "@/features/panelMap/classHighlight";
import type {
  GeodataStyles,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import { featureProps, featuresInArea } from "@/features/panelMap/mapSelection";
import { formatNumber } from "@/features/panels/format";
import type { TerritorialArea } from "@/features/panels/territorialFilters";
import type { PanelMapEngine } from "@/lib/panelMapEngine";

// Mouse, foco ou toque numa pílula destaca a classe no mapa (como a legenda
// por porte do card antigo); cada fonte se desfaz sozinha
// (`chipHighlightReducer`).
type ChipHighlight = (action: ChipHighlightAction) => void;

const hoverChip = (onHighlight: ChipHighlight) => (index: number | null) =>
  onHighlight({ type: "hover", index });

// WHY o toque no pointerup e não no clique: o Enter e o Espaço do teclado
// também disparam o clique, e o teclado já destaca pelo foco.
const tapChip =
  (index: number, onHighlight: ChipHighlight) =>
  (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") onHighlight({ type: "tap", index });
  };

// WHY o hover só com mouse: no toque o pointerenter/leave vêm junto do toque.
const chipHighlightHandlers = (index: number, onHighlight: ChipHighlight) => ({
  onPointerEnter: previewOnMouse(hoverChip(onHighlight), index),
  onPointerLeave: previewOnMouse(hoverChip(onHighlight), null),
  onPointerUp: tapChip(index, onHighlight),
  onFocus: () => onHighlight({ type: "focus", index }),
  onBlur: () => onHighlight({ type: "blur" }),
});

const CHIP_CLASS =
  "inline-flex items-center gap-1.5 rounded-[6px] border border-grey-300 bg-white px-2.5 py-1 text-[11.5px] font-medium hover:border-grey-500 focus-visible:outline-2 focus-visible:outline-(--proto-accent)";

const chipText = ({ label, count }: LegendChipData) =>
  count === undefined ? label : `${label} (${formatNumber(count)})`;

type LegendChipProps = {
  chip: LegendChipData;
  index: number;
  hintId: string;
  onHighlight: ChipHighlight;
};

const LegendChip = ({ chip, index, hintId, onHighlight }: LegendChipProps) => (
  <li>
    <button
      type="button"
      aria-describedby={hintId}
      {...chipHighlightHandlers(index, onHighlight)}
      className={CHIP_CLASS}
    >
      <i
        aria-hidden="true"
        className="inline-block size-3 rounded-full border border-black/10"
        style={{ background: chip.color }}
      />
      {chipText(chip)}
    </button>
  </li>
);

type LegendChipsProps = Omit<LegendChipProps, "chip" | "index" | "hintId"> & {
  label: string;
  chips: LegendChipData[];
};

const LegendChips = ({ label, chips, onHighlight }: LegendChipsProps) => {
  const hintId = useId();

  return (
    <>
      <p id={hintId} className="sr-only">
        {LEGEND_HINT}
      </p>
      <ul aria-label={label} className="flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <LegendChip
            key={`${index}-${chip.label}`}
            {...{ chip, index, hintId, onHighlight }}
          />
        ))}
      </ul>
    </>
  );
};

type PanelMapLegendProps = {
  styles: GeodataStyles;
  features: FeatureCollection;
  indicator: PanelIndicator;
  area: TerritorialArea;
  ano: number;

  // Aridez: municípios por classe predominante, por valor da classe (do banco).
  classCounts?: ReadonlyMap<number, number>;

  // Aridez: classe predominante por `code` do município, para o destaque.
  classOf?: ReadonlyMap<string, number>;
  engine: PanelMapEngine | null;
};

const LEGEND_HINT =
  "Passe o mouse, toque ou leve o foco a uma classe para destacá-la no mapa.";

type ChipInputs = Omit<PanelMapLegendProps, "classOf" | "engine">;

function legendChips(props: ChipInputs): LegendChipData[] {
  const { styles, features, indicator, area, ano } = props;

  if (indicator === "aridez") {
    return paletteChips(styles.aridez, props.classCounts);
  }
  const inArea = featuresInArea(featureProps(features), indicator, area);

  return countByClass(inArea, styles.indicators[indicator].classes, ano);
}

// PERF: a contagem percorre ~1.800 municípios; só muda com feições, área e ano.
function useLegendChips(props: PanelMapLegendProps): LegendChipData[] {
  const { styles, features, indicator, area, ano, classCounts } = props;

  return useMemo(
    () => legendChips({ styles, features, indicator, area, ano, classCounts }),
    [styles, features, indicator, area, ano, classCounts],
  );
}

type HighlightInputs = Pick<
  PanelMapLegendProps,
  "styles" | "indicator" | "ano" | "classOf"
>;

function highlightSource(inputs: HighlightInputs): LegendHighlightSource {
  const { styles, indicator, ano, classOf } = inputs;

  if (indicator === "aridez") {
    return { kind: "palette", palette: styles.aridez, classOf };
  }

  return {
    kind: "classes",
    classes: styles.indicators[indicator].classes,
    ano,
  };
}

function useHighlightSource(props: PanelMapLegendProps) {
  const { styles, indicator, ano, classOf } = props;

  return useMemo(
    () => highlightSource({ styles, indicator, ano, classOf }),
    [styles, indicator, ano, classOf],
  );
}

// Recalcula com o ano do momento: trocar o ano com o mouse parado na pílula
// atualiza o destaque. A área não entra: o motor só apaga feições da área.
function useChipHighlight(props: PanelMapLegendProps): ChipHighlight {
  const [state, dispatch] = useReducer(chipHighlightReducer, NO_CHIP_HIGHLIGHT);
  const chipIndex = activeChip(state);
  const source = useHighlightSource(props);
  const { engine } = props;

  useEffect(() => {
    const filter =
      chipIndex === null ? null : chipHighlightFilter(source, chipIndex);

    engine?.setClassHighlight(filter);
  }, [engine, chipIndex, source]);

  return dispatch;
}

/**
 * Legenda do mapa, abaixo da caixa dele: uma pílula por classe do `.qgz` com
 * a contagem de feições da área no ano ("Pequeno (1.619)"), mais "Sem dado"
 * quando houver. Na aridez, a paleta do raster com as contagens que o painel
 * mandou em `classCounts` (sem elas, só as cores). Mouse, foco ou toque numa
 * pílula destaca a classe no mapa (`engine.setClassHighlight`): as feições
 * das outras classes ficam cinza sólido.
 *
 * @example <PanelMapLegend styles={styles} features={features} indicator="pib" area="nordeste" ano={2023} engine={engine} />
 */
export const PanelMapLegend = (props: PanelMapLegendProps) => {
  const chips = useLegendChips(props);
  const onHighlight = useChipHighlight(props);

  return (
    <div className="mt-3">
      <LegendChips
        label="Legenda do mapa"
        chips={chips}
        onHighlight={onHighlight}
      />
    </div>
  );
};
