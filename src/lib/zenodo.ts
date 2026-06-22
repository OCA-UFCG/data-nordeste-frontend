import { ZENODO_BASE_URL } from "@/utils/constants";
import { IMetadata } from "@/utils/interfaces";

export type ZenodoFilters = {
  [key: string]: string[] | Date | string | undefined;
  date_gte?: Date;
  date_lte?: Date;
  search?: string;
  sort?: string;
};

type ZenodoApiFile = {
  key: string;
  links: {
    self: string;
  };
};

type ZenodoApiRecord = {
  id: number | string;
  created: string;
  metadata?: {
    title?: string;
    description?: string;
    version?: string;
    keywords?: string[];
    license?: {
      id?: string;
    };
  };
  links: {
    self_html: string;
  };
  files?: ZenodoApiFile[];
};

type ZenodoApiResponse = {
  hits: {
    total: number;
    hits?: ZenodoApiRecord[];
  };
};

export type ZenodoCommunityRecordsResult = {
  records: IMetadata[];
  totalPages: number;
  currentPage: number;
};

export type ZenodoRecordsFetcher = (
  url: string,
) => Promise<ZenodoApiResponse | ZenodoApiRecord>;

export async function getZenodoCommunityRecords(
  page: number,
  size: number,
  filters: ZenodoFilters = {},
  fetchRecords: ZenodoRecordsFetcher = fetchZenodoData,
): Promise<ZenodoCommunityRecordsResult> {
  const query = buildZenodoRecordsQuery(page, size, filters);
  const url = `${ZENODO_BASE_URL}?${query.toString()}`;
  const json = (await fetchRecords(url)) as ZenodoApiResponse;
  const records = parseZenodoRecords(json);

  return {
    records,
    totalPages: Math.ceil(json.hits.total / size),
    currentPage: page,
  };
}

export async function getZenodoRecord(
  recordId: string,
  fetchRecord: ZenodoRecordsFetcher = fetchZenodoData,
): Promise<IMetadata> {
  const json = (await fetchRecord(
    `${ZENODO_BASE_URL}/${encodeURIComponent(recordId)}`,
  )) as ZenodoApiRecord;

  return parseZenodoRecord(json);
}

export const buildZenodoRecordsQuery = (
  page: number,
  size: number,
  filters: ZenodoFilters,
): URLSearchParams => {
  const query = new URLSearchParams({
    communities: "datane",
    size: size.toString(),
    page: page.toString(),
  });

  if (filters.sort) query.append("sort", filters.sort);

  const { dateCondition, searchCondition, otherConditions } =
    buildConditions(filters);
  const finalQuery = buildFinalQuery(
    dateCondition,
    searchCondition,
    otherConditions,
  );

  if (finalQuery) query.append("q", finalQuery);

  return query;
};

export const buildZenodoFilesArchiveUrl = (recordId: string): string =>
  `${ZENODO_BASE_URL}/${recordId}/files-archive`;

export const buildZenodoArchiveFileName = (title: string): string =>
  title.replace(/\s+/g, "_").toLowerCase() + ".zip";

const buildConditions = (filters: ZenodoFilters) => {
  let dateCondition = "";
  const otherConditions: string[] = [];
  const searchCondition = buildSearchCondition(filters.search);

  const gte = filters.date_gte ? formatDate(filters.date_gte) : "*";
  const lte = filters.date_lte ? formatDate(filters.date_lte) : "*";

  if (filters.date_gte || filters.date_lte) {
    dateCondition = `publication_date:[${gte} TO ${lte}]`;
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (!value || key.startsWith("date_") || key === "search") return;

    if (Array.isArray(value) && value.length) {
      const arrQuery = buildArrayQuery(value);
      if (arrQuery) otherConditions.push(arrQuery);
    }
  });

  return { dateCondition, searchCondition, otherConditions };
};

const buildFinalQuery = (
  dateCondition: string,
  searchCondition: string,
  otherConditions: string[],
): string => {
  // INTENTIONAL: Text search scans the whole catalog. Theme filters must not
  // hide a matching dataset merely because a category was selected earlier.
  if (searchCondition) {
    return [dateCondition, searchCondition].filter(Boolean).join(" AND ");
  }

  return [
    dateCondition,
    otherConditions.length ? `(${otherConditions.join(" OR ")})` : "",
  ]
    .filter(Boolean)
    .join(" AND ");
};

const buildSearchCondition = (search: string | undefined): string => {
  const normalizedSearch = search?.trim();
  if (!normalizedSearch) return "";

  return normalizedSearch
    .split(/\s+/)
    .map((term) => `${escapeZenodoSearchTerm(term)}*`)
    .join(" AND ");
};

const escapeZenodoSearchTerm = (term: string): string =>
  term.replace(/([+\-=&|><!(){}[\]^"~?:\\/])/g, "\\$1");

const buildArrayQuery = (items: string[]): string | null => {
  if (!items.length) return null;

  const queries = items.map((item) => `"${item}"`);

  return queries.join(" OR ");
};

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const fetchZenodoData = async (
  url: string,
): Promise<ZenodoApiResponse | ZenodoApiRecord> => {
  // PERF: Zenodo catalog data is shared by filters and pagination, so keep a
  // short Next revalidation window instead of refetching every request.
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(
      `Zenodo request failed for url "${url}" with status ${res.status}; expected records response for community "datane". Status text: ${res.statusText}`,
    );
  }

  return res.json();
};

export const parseZenodoRecords = (json: ZenodoApiResponse): IMetadata[] => {
  return (json.hits.hits ?? []).map(parseZenodoRecord);
};

const parseZenodoRecord = (r: ZenodoApiRecord): IMetadata => ({
  id: String(r.id),
  title: r.metadata?.title ?? "",
  description: r.metadata?.description ?? "",
  publication_date: r.created,
  version: r.metadata?.version ?? "1.0",
  tags: r.metadata?.keywords ?? [],
  html: r.links.self_html,
  license: r.metadata?.license?.id ?? "Desconhecida",
  files: (r.files ?? []).map((f: ZenodoApiFile) => ({
    name: f.key,
    downloadUrl: f.links.self,
  })),
});
