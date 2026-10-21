export type VabSectorKey =
  | "agropecuaria"
  | "industria"
  | "servicos"
  | "adm_publica";

export type PibPanelSelection = {
  area: string;
  uf: string | null;
  municipio: number | null;
};

export type PibSeriesPoint = {
  ano: number;
  pibTotal: number | null;
  pibPerCapita: number | null;
};

export type PibVabYear = {
  ano: number;
  sectors: { [sector in VabSectorKey]: number | null };
};

export type PibActivity = {
  ano: number;
  activity: string;
  municipalities: number;
  vab: number | null;
  pibShare: number | null;
};

export type PibPanelOptions = {
  areas: { id: string; name: string }[];
  ufs: string[];
  municipalities: { code: number; name: string }[];
};

export type PibPanel = {
  source: string;
  selection: PibPanelSelection;
  options: PibPanelOptions;
  series: PibSeriesPoint[];
  vab: PibVabYear[];
  activities: PibActivity[];
};

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

// Same default as AREA_PADRAO in Automatic-Reporting utils/queries/painel_pib.py.
export const DEFAULT_PIB_SELECTION: PibPanelSelection = {
  area: "aas_21",
  uf: null,
  municipio: null,
};

type RawPibPanel = {
  fonte: string;
  recorte: { area: string; uf: string | null; municipio: number | null };
  opcoes: {
    areas: { id: string; nome: string }[];
    ufs: string[];
    municipios: { codigo: number; nome: string }[];
  };
  serie: {
    ano: number;
    pib_total: number | null;
    pib_per_capita: number | null;
  }[];
  vab: ({ ano: number } & { [sector in VabSectorKey]: number | null })[];
  atividades: {
    ano: number;
    atividade: string;
    municipios: number;
    vab: number | null;
    participacao_pib: number | null;
  }[];
};

/**
 * Converts the Automatic-Reporting `GET /paineis/pib` payload into the panel model.
 * Example: `parsePibPanel(await response.json()).series.at(-1)?.ano === 2023`.
 */
export function parsePibPanel(payload: unknown): PibPanel {
  if (!isRawPibPanel(payload)) {
    throw new Error(
      `Invalid PIB panel payload ${JSON.stringify(payload)?.slice(0, 120)}; expected { fonte, recorte, opcoes, serie[], vab[], atividades[] }.`,
    );
  }

  return {
    source: payload.fonte,
    selection: payload.recorte,
    options: toPanelOptions(payload.opcoes),
    series: payload.serie.map(toSeriesPoint),
    vab: payload.vab.map(toVabYear),
    activities: payload.atividades.map(toActivity),
  };
}

function isRawPibPanel(payload: unknown): payload is RawPibPanel {
  if (typeof payload !== "object" || payload === null) return false;

  const candidate = payload as Partial<RawPibPanel>;

  return (
    typeof candidate.fonte === "string" &&
    typeof candidate.recorte === "object" &&
    typeof candidate.opcoes === "object" &&
    [candidate.serie, candidate.vab, candidate.atividades].every(Array.isArray)
  );
}

function toPanelOptions(raw: RawPibPanel["opcoes"]): PibPanelOptions {
  return {
    areas: raw.areas.map(({ id, nome }) => ({ id, name: nome })),
    ufs: raw.ufs,
    municipalities: raw.municipios.map(({ codigo, nome }) => ({
      code: codigo,
      name: nome,
    })),
  };
}

function toSeriesPoint(raw: RawPibPanel["serie"][number]): PibSeriesPoint {
  return {
    ano: raw.ano,
    pibTotal: raw.pib_total,
    pibPerCapita: raw.pib_per_capita,
  };
}

function toVabYear({
  ano,
  ...sectors
}: RawPibPanel["vab"][number]): PibVabYear {
  return { ano, sectors };
}

function toActivity(raw: RawPibPanel["atividades"][number]): PibActivity {
  return {
    ano: raw.ano,
    activity: raw.atividade,
    municipalities: raw.municipios,
    vab: raw.vab,
    pibShare: raw.participacao_pib,
  };
}

/** Most recent year with PIB data, or null. Example: `getLatestPibYear(panel) === 2023`. */
export function getLatestPibYear(panel: PibPanel): number | null {
  return panel.series.at(-1)?.ano ?? null;
}

/** PIB of the selection in one year. Example: `findPibPoint(panel, 2023)?.pibTotal`. */
export function findPibPoint(
  panel: PibPanel,
  ano: number,
): PibSeriesPoint | null {
  return panel.series.find((point) => point.ano === ano) ?? null;
}

/**
 * IBGE publishes VAB and the main activity two years after PIB, so for a recent
 * year this falls back to the latest earlier year that has them.
 * Example: `resolveBreakdownYear([2010, 2021], 2023) === 2021`.
 */
export function resolveBreakdownYear(
  years: number[],
  ano: number,
): number | null {
  const available = years.filter((year) => year <= ano);

  return available.length ? Math.max(...available) : null;
}

/**
 * VAB by sector with each sector's share of the total VAB, largest first.
 * Sectors without data are left out. Example: `getVabShares(vabYear)[0].label === "Serviços"`.
 */
export function getVabShares(vabYear: PibVabYear): VabShare[] {
  const sectors = (Object.keys(VAB_SECTOR_LABELS) as VabSectorKey[]).flatMap(
    (sector) => toVabValue(vabYear, sector),
  );
  const total = sectors.reduce((sum, item) => sum + item.value, 0);

  return sectors
    .map((item) => ({ ...item, share: total ? item.value / total : 0 }))
    .sort((a, b) => b.value - a.value);
}

function toVabValue(
  vabYear: PibVabYear,
  sector: VabSectorKey,
): Omit<VabShare, "share">[] {
  const value = vabYear.sectors[sector];

  return value === null
    ? []
    : [{ sector, label: VAB_SECTOR_LABELS[sector], value }];
}

/** Main activities of one year, by number of municipalities. Example: `getActivitiesOfYear(panel, 2021)`. */
export function getActivitiesOfYear(
  panel: PibPanel,
  ano: number,
): PibActivity[] {
  return panel.activities
    .filter((activity) => activity.ano === ano)
    .sort((a, b) => b.municipalities - a.municipalities);
}

/** Human name of the current selection. Example: `getSelectionLabel(panel) === "Campina Grande"`. */
export function getSelectionLabel(panel: PibPanel): string {
  const { area, uf, municipio } = panel.selection;
  const municipality = panel.options.municipalities.find(
    (option) => option.code === municipio,
  );

  if (municipality) return `${municipality.name} (${uf})`;
  if (uf) return uf;

  return panel.options.areas.find((option) => option.id === area)?.name ?? area;
}
