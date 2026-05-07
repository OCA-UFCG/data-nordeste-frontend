import { ZENODO_BASE_URL } from "@/utils/constants";
import { IMetadata } from "@/utils/interfaces";

export type ZenodoFilters = {
  [key: string]: string[] | Date | string | undefined;
  date_gte?: Date;
  date_lte?: Date;
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

export async function getZenodoCommunityRecords(
  page: number,
  size: number,
  filters: ZenodoFilters = {},
): Promise<ZenodoCommunityRecordsResult> {
  const query = buildZenodoRecordsQuery(page, size, filters);
  const url = `${ZENODO_BASE_URL}?${query.toString()}`;
  const json = await fetchZenodoData(url);
  const records = parseZenodoRecords(json);

  return {
    records,
    totalPages: Math.ceil(json.hits.total / size),
    currentPage: page,
  };
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

  const { dateCondition, otherConditions } = buildConditions(filters);

  let finalQuery = "";

  if (dateCondition && otherConditions.length) {
    finalQuery = `${dateCondition} AND (${otherConditions.join(" OR ")})`;
  } else if (dateCondition) {
    finalQuery = dateCondition;
  } else if (otherConditions.length) {
    finalQuery = otherConditions.join(" OR ");
  }

  if (finalQuery) query.append("q", finalQuery);

  return query;
};

const buildConditions = (filters: ZenodoFilters) => {
  let dateCondition = "";
  const otherConditions: string[] = [];

  const gte = filters.date_gte ? formatDate(filters.date_gte) : "*";
  const lte = filters.date_lte ? formatDate(filters.date_lte) : "*";

  if (filters.date_gte || filters.date_lte) {
    dateCondition = `publication_date:[${gte} TO ${lte}]`;
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (!value || key.startsWith("date_")) return;

    if (Array.isArray(value) && value.length) {
      const arrQuery = buildArrayQuery(value);
      if (arrQuery) otherConditions.push(arrQuery);
    }
  });

  return { dateCondition, otherConditions };
};

const buildArrayQuery = (items: string[]): string | null => {
  if (!items.length) return null;

  const queries = items.map((item) => `"${item}"`);

  return queries.join(" OR ");
};

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const fetchZenodoData = async (url: string): Promise<ZenodoApiResponse> => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Error fetching Zenodo data: ${res.statusText}`);
  }

  return res.json();
};

export const parseZenodoRecords = (json: ZenodoApiResponse): IMetadata[] => {
  return (json.hits.hits ?? []).map((r) => ({
    id: String(r.id),
    title: r.metadata?.title ?? "",
    description: r.metadata?.description ?? "",
    publication_date: r.created,
    version: r.metadata?.version ?? "1.0",
    tags: r.metadata?.keywords ?? [],
    html: r.links.self_html,
    license: r.metadata?.license?.id ?? "Desconhecida",
    files: (r.files ?? []).map((f: any) => ({
      name: f.key,
      downloadUrl: f.links.self,
    })),
  }));
};
