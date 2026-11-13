import {
  defaultTerritorialFilters,
  type TerritorialFilters,
  type YearRange,
} from "@/features/panels/territorialFilters";
import {
  areaLabel,
  describeSelectedMunicipios,
  describeSelectedUfs,
  selectedMunicipioNames,
  selectedUfNames,
  type TerritorialSelection,
} from "@/features/panels/territorialOptions";

/**
 * Lugar dos subtítulos dos cards: a área, depois os estados e os municípios
 * escolhidos, separados por " · ". Com muitos, resume como o "Mostrando".
 *
 * @example describePerfilPlace(selection) // "Semiárido · Pernambuco · Recife (PE)"
 */
export const describePerfilPlace = (selection: TerritorialSelection): string =>
  [
    areaLabel(selection.filters.area),
    describeSelectedUfs(selection),
    describeSelectedMunicipios(selection),
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");

const listOrAll = (names: string[]): string =>
  names.length ? names.join(", ") : "Todos";

/**
 * Chips do "Compartilhar" do card: ano, área, estados e municípios, com
 * "Todos" quando o filtro está vazio.
 *
 * @example describePerfilShareChips(selection) // ["Ano: 2022", "Área: Nordeste", "Estado: Todos", "Município: Todos"]
 */
export const describePerfilShareChips = (
  selection: TerritorialSelection,
): string[] => [
  `Ano: ${selection.filters.ano}`,
  `Área: ${areaLabel(selection.filters.area)}`,
  `Estado: ${listOrAll(selectedUfNames(selection))}`,
  `Município: ${listOrAll(selectedMunicipioNames(selection))}`,
];

/**
 * Clicar num estado no mapa: entra ou sai da lista de UFs. O município some,
 * porque ele pode não pertencer ao novo conjunto de estados.
 *
 * @example togglePerfilUf({ ano: 2022, area: "nordeste", uf: ["PB"] }, "PE").uf // ["PB", "PE"]
 */
export const togglePerfilUf = (
  filters: TerritorialFilters,
  uf: string,
): TerritorialFilters => {
  const current = filters.uf ?? [];
  const next = current.includes(uf)
    ? current.filter((item) => item !== uf)
    : [...current, uf];

  return { ...filters, uf: next.length ? next : undefined, mun: undefined };
};

/**
 * Os filtros estão no padrão (Nordeste, último censo, sem estado nem município)?
 * Decide se o "Limpar filtros" fica desligado.
 *
 * @example isDefaultPerfilFilters({ ano: 2022, area: "nordeste" }, range) // true
 */
export const isDefaultPerfilFilters = (
  filters: TerritorialFilters,
  range: YearRange,
): boolean => {
  const defaults = defaultTerritorialFilters(range);

  return (
    filters.ano === defaults.ano &&
    filters.area === defaults.area &&
    !filters.uf &&
    !filters.mun
  );
};

/**
 * Texto do botão "Ver …" do aviso de dados vazios: o padrão do painel.
 *
 * @example describePerfilDefaultLabel(range) // "Ver Nordeste · 2022"
 */
export const describePerfilDefaultLabel = (range: YearRange): string => {
  const defaults = defaultTerritorialFilters(range);
  const place = describePerfilPlace({
    filters: defaults,
    ufs: [],
    municipios: [],
  });

  return `Ver ${place} · ${defaults.ano}`;
};
