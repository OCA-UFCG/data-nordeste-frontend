import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import {
  describeMapFeature,
  type FeatureValueReader,
  type MapTooltipText,
  type MapValueFormat,
} from "@/features/panelMap/mapTooltip";
import { rankRegions } from "@/features/panels/choropleth";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

/**
 * Número de cada estado no hover por estado (só a área de interesse ativa):
 * a soma dos municípios dele que estão na área. Serve a valores que se somam
 * (PIB, população); um percentual (aridez) vem pronto do painel. Município sem
 * número fica de fora da soma; estado sem nenhum número fica fora do mapa
 * ("sem dado", fora do ranking).
 * Ex.: PE com 60 e 9 na área e PB só com null → `Map { "PE" => 69 }`.
 */
export function stateTotalsInArea(
  municipios: MapFeatureProps[],
  area: TerritorialArea,
  readValue: FeatureValueReader,
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const municipio of municipios) {
    const value = readValue(municipio);

    if (municipio[area] !== 1 || value === null) continue;
    totals.set(municipio.uf, (totals.get(municipio.uf) ?? 0) + value);
  }

  return totals;
}

/**
 * Posição de cada estado entre os que têm número na área.
 * Ex.: `Map { "PE" => 69, "PB" => 28 }` → `Map { "PE" => 1, "PB" => 2 }`.
 */
export function rankStates(
  totals: ReadonlyMap<string, number>,
): Map<string, number> {
  const regions = [...totals].map(([code, value]) => ({ code, value }));

  return rankRegions(regions);
}

/**
 * Propriedades do estado da sigla no `estados.geojson` (o nome vem dele).
 * Sem o estado no arquivo, só a sigla.
 * Ex.: `stateProps(estados, "BA")` → `{ code: "BA", name: "Bahia", uf: "BA" }`.
 */
export function stateProps(
  states: MapFeatureProps[],
  sigla: string,
): MapFeatureProps {
  const state = states.find(({ code }) => code === sigla);

  return state ?? { code: sigla, name: sigla, uf: sigla };
}

/**
 * Tooltip do hover por estado: "<Nome> (<UF>)", o total do estado na área e a
 * posição entre os estados com número. Os mesmos textos do município.
 * Ex.: Bahia com total 50, 1º de 9 → `{ title: "Bahia (BA)", value: "PIB: R$ 50", rank: "1º de 9" }`.
 */
export function describeState(
  state: MapFeatureProps,
  totals: ReadonlyMap<string, number>,
  format: MapValueFormat,
): MapTooltipText {
  const ranks = rankStates(totals);
  const readTotal: FeatureValueReader = ({ code }) => totals.get(code) ?? null;

  return describeMapFeature(state, readTotal, ranks, ranks.size, format);
}
