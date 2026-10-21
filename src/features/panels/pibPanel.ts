export type VabSectorKey =
  | "agropecuaria"
  | "industria"
  | "servicos"
  | "adm_publica";

export type PibPanelRecord = {
  uf: string;
  ano: number;
  pibTotal: number | null;
  pibPerCapita: number | null;
  vab: { [sector in VabSectorKey]: number | null };
};

export type PibPanel = {
  source: string;
  years: number[];
  ufs: string[];
  records: PibPanelRecord[];
};

export type PibSeriesPoint = {
  ano: number;
  pibTotal: number | null;
  pibPerCapita: number | null;
};

export type PibRankingItem = { uf: string; value: number };

export type VabShare = {
  sector: VabSectorKey;
  label: string;
  value: number;
  share: number;
};

export const VAB_SECTOR_LABELS: { [sector in VabSectorKey]: string } = {
  agropecuaria: "Agropecuária",
  industria: "Indústria",
  servicos: "Serviços",
  adm_publica: "Administração Pública",
};

type RawPibRecord = {
  uf: string;
  ano: number;
  pib_total: number | null;
  pib_per_capita: number | null;
  vab: { [sector in VabSectorKey]: number | null };
};

type RawPibPanel = {
  fonte: string;
  anos: number[];
  ufs: string[];
  registros: RawPibRecord[];
};

/**
 * Converts the Automatic-Reporting `GET /paineis/pib` payload into the panel model.
 * Example: `parsePibPanel(await response.json()).years.at(-1) === 2023`.
 */
export function parsePibPanel(payload: unknown): PibPanel {
  if (!isRawPibPanel(payload)) {
    throw new Error(
      `Invalid PIB panel payload ${JSON.stringify(payload)?.slice(0, 120)}; expected { fonte, anos[], ufs[], registros[] }.`,
    );
  }

  return {
    source: payload.fonte,
    years: payload.anos,
    ufs: payload.ufs,
    records: payload.registros.map(toPibPanelRecord),
  };
}

function isRawPibPanel(payload: unknown): payload is RawPibPanel {
  if (typeof payload !== "object" || payload === null) return false;

  const candidate = payload as Partial<RawPibPanel>;

  return (
    typeof candidate.fonte === "string" &&
    Array.isArray(candidate.anos) &&
    Array.isArray(candidate.ufs) &&
    Array.isArray(candidate.registros)
  );
}

function toPibPanelRecord(raw: RawPibRecord): PibPanelRecord {
  return {
    uf: raw.uf,
    ano: raw.ano,
    pibTotal: raw.pib_total,
    pibPerCapita: raw.pib_per_capita,
    vab: raw.vab,
  };
}

/** Yearly PIB of one UF, oldest first. Example: `getPibSeries(panel, "PB")`. */
export function getPibSeries(panel: PibPanel, uf: string): PibSeriesPoint[] {
  return panel.records
    .filter((record) => record.uf === uf)
    .sort((a, b) => a.ano - b.ano)
    .map(({ ano, pibTotal, pibPerCapita }) => ({
      ano,
      pibTotal,
      pibPerCapita,
    }));
}

export type PibMetric = "pibTotal" | "pibPerCapita";

/** UFs ranked by a metric in one year, largest first. Example: `getPibRanking(panel, 2023, "pibTotal")`. */
export function getPibRanking(
  panel: PibPanel,
  ano: number,
  metric: PibMetric,
): PibRankingItem[] {
  return panel.records
    .filter((record) => record.ano === ano)
    .flatMap((record) => toRankingItem(record, metric))
    .sort((a, b) => b.value - a.value);
}

function toRankingItem(
  record: PibPanelRecord,
  metric: PibMetric,
): PibRankingItem[] {
  const value = record[metric];

  return value === null ? [] : [{ uf: record.uf, value }];
}

/** Finds the record of one UF in one year. Example: `findPibRecord(panel, "PB", 2023)`. */
export function findPibRecord(
  panel: PibPanel,
  uf: string,
  ano: number,
): PibPanelRecord | null {
  return (
    panel.records.find((record) => record.uf === uf && record.ano === ano) ??
    null
  );
}

/**
 * VAB by sector with each sector's share of the total VAB, largest first.
 * Sectors without data are left out. Example: `getVabShares(record)[0].label === "Serviços"`.
 */
export function getVabShares(record: PibPanelRecord): VabShare[] {
  const sectors = (Object.keys(VAB_SECTOR_LABELS) as VabSectorKey[]).flatMap(
    (sector) => toVabValue(record, sector),
  );
  const total = sectors.reduce((sum, item) => sum + item.value, 0);

  return sectors
    .map((item) => ({ ...item, share: total ? item.value / total : 0 }))
    .sort((a, b) => b.value - a.value);
}

function toVabValue(
  record: PibPanelRecord,
  sector: VabSectorKey,
): Omit<VabShare, "share">[] {
  const value = record.vab[sector];

  return value === null
    ? []
    : [{ sector, label: VAB_SECTOR_LABELS[sector], value }];
}

/**
 * Percent change of PIB against the previous year, or null without both years.
 * Example: `getPibYearOverYear(panel, "PB", 2023) === 0.125`.
 */
export function getPibYearOverYear(
  panel: PibPanel,
  uf: string,
  ano: number,
): number | null {
  const current = findPibRecord(panel, uf, ano)?.pibTotal ?? null;
  const previous = findPibRecord(panel, uf, ano - 1)?.pibTotal ?? null;

  if (current === null || !previous) return null;

  return current / previous - 1;
}
