export type FilterOption = { value: string; label: string };

// Rótulo já normalizado: a busca roda a cada tecla sobre ~2 mil municípios.
export type IndexedOption = FilterOption & { searchKey: string };

const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export const indexOptions = (options: FilterOption[]): IndexedOption[] =>
  options.map((option) => ({ ...option, searchKey: normalize(option.label) }));

/**
 * Options matching the search, ignoring accents and case, with the `pinned`
 * ones first so a long list keeps them reachable.
 * @example searchOptions(indexOptions(municipios), "joao", ["2507507"])
 */
export const searchOptions = (
  options: IndexedOption[],
  query: string,
  pinned: string[],
): IndexedOption[] => {
  const wanted = normalize(query);
  const first = new Set(pinned);
  const matches = wanted
    ? options.filter((option) => option.searchKey.includes(wanted))
    : options;

  return [
    ...matches.filter((option) => first.has(option.value)),
    ...matches.filter((option) => !first.has(option.value)),
  ];
};

// Marcar um valor já escolhido tira ele da seleção; senão, acrescenta.
export const toggleValue = (values: string[], value: string): string[] =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

// Mesma seleção em outra ordem não é mudança: não vale outra consulta.
export const sameValues = (a: string[], b: string[]): boolean => {
  const set = new Set(a);

  return set.size === new Set(b).size && b.every((value) => set.has(value));
};
