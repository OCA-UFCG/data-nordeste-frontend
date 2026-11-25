import { legendChips } from "@/features/panelMap/legendChips";
import type {
  GeodataStyles,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import type { MapRecorte } from "@/features/panelMap/mapRecorte";
import {
  buildPosterInset,
  type PosterShapes,
} from "@/features/panels/mapPosterShapes";
import type {
  MapPosterData,
  MapPosterLegendItem,
} from "@/features/panels/mapPosterData";
import {
  NO_YEAR,
  type TerritorialArea,
} from "@/features/panels/territorialFilters";
import {
  areaLabel,
  describeSelectedMunicipios,
  describeSelectedUfs,
  type TerritorialSelection,
} from "@/features/panels/territorialOptions";

// O que vem igual para todos os cards do painel (contexto do menu): o nome do
// painel, o ícone, a cor, a data, o lugar filtrado e os chips de filtros.
export type MapPosterBase = Pick<
  MapPosterData,
  "panelName" | "icon" | "accent" | "updatedAt" | "chips"
> & { place: string };

// Os geodados que o cartaz lê do mapa: o `ReadyGeodata` do `PanelMap`.
export type PosterGeodata = PosterShapes & { styles: GeodataStyles };

// O que cada card do mapa informa: o indicador e o texto do subtítulo (o ano
// entra aqui), a fonte (sem o crédito do basemap) e o recorte desenhado.
export type MapPosterCardInput = {
  name: string;
  subtitle: string;
  source: string;
  indicator: PanelIndicator;
  area: TerritorialArea;
  ano: number;
  recorte: MapRecorte;
  classCounts?: ReadonlyMap<number, number>;

  // `null` enquanto os geodados não chegaram: o cartaz sai sem legenda e sem
  // mini-mapa, mas o download não quebra.
  geodata: PosterGeodata | null;
};

/**
 * O lugar do título do cartaz: o recorte mais específico (município, senão
 * estado, senão o rótulo da área).
 *
 * @example posterPlace(selection) // "Recife (PE)", "Pernambuco" ou "Nordeste"
 */
export const posterPlace = (selection: TerritorialSelection): string =>
  describeSelectedMunicipios(selection) ??
  describeSelectedUfs(selection) ??
  areaLabel(selection.filters.area);

// Rótulo e cor, sem a contagem de feições da legenda da tela.
const posterLegend = (input: MapPosterCardInput): MapPosterLegendItem[] =>
  input.geodata
    ? legendChips({ ...input, ...input.geodata }).map(({ color, label }) => ({
        color,
        label,
      }))
    : [];

const posterInset = (input: MapPosterCardInput, place: string) =>
  input.geodata
    ? buildPosterInset(input.geodata, input.area, input.recorte, place)
    : null;

const withPosterYear = (text: string, ano: number) =>
  ano === NO_YEAR ? text : `${text} - ${ano}`;

/**
 * Os dados do cartaz de download de um card com mapa.
 *
 * @example buildMapPoster(base, { name: "PIB", subtitle: "PIB por município", source: PIB_CARD_SOURCE, indicator: "pib", area: "nordeste", ano: 2021, recorte, geodata }).title // "Mapa do PIB - Nordeste"
 */
export const buildMapPoster = (
  base: MapPosterBase,
  input: MapPosterCardInput,
): MapPosterData => ({
  panelName: base.panelName,
  icon: base.icon,
  accent: base.accent,
  title: `Mapa do ${input.name} - ${base.place}`,
  subtitle: withPosterYear(input.subtitle, input.ano),
  chips: base.chips,
  legend: posterLegend(input),
  inset: posterInset(input, base.place),
  source: input.source,
  updatedAt: base.updatedAt,
});
