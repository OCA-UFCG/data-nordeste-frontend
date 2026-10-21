const compactBrl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const wholeBrl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const signedPercent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

const NO_VALUE = "—";

/** Large BRL amounts for tiles and axes. Example: `formatCompactBrl(8e10) === "R$ 80 bi"`. */
export function formatCompactBrl(value: number | null): string {
  return value === null ? NO_VALUE : compactBrl.format(value);
}

/** Per-capita BRL without cents. Example: `formatWholeBrl(20000) === "R$ 20.000"`. */
export function formatWholeBrl(value: number | null): string {
  return value === null ? NO_VALUE : wholeBrl.format(value);
}

/** Signed change as percent. Example: `formatSignedPercent(0.125) === "+12,5%"`. */
export function formatSignedPercent(value: number | null): string {
  return value === null ? NO_VALUE : signedPercent.format(value);
}

const plainPercent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

/** Share as percent. Example: `formatPercent(0.461) === "46,1%"`. */
export function formatPercent(value: number | null): string {
  return value === null ? NO_VALUE : plainPercent.format(value);
}
