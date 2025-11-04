export async function getZenodoCommunityRecords(
  page: number,
  size: number,
  filters: Record<string, any> = {},
) {
  const query = buildBaseQuery(page, size, filters);
  const url = `https://zenodo.org/api/records?${query.toString()}`;
  const json = await fetchZenodoData(url);
  const records = parseZenodoRecords(json);

  return {
    records,
    totalPages: Math.ceil(json.hits.total / size),
    currentPage: page,
  };
}

const buildBaseQuery = (
  page: number,
  size: number,
  filters: Record<string, any>,
) => {
  const query = new URLSearchParams({
    communities: "datane",
    size: size.toString(),
    page: page.toString(),
  });

  if (filters.sort) query.append("sort", filters.sort);

  const conditions = buildConditions(filters);
  if (conditions.length) query.append("q", conditions.join(" OR "));

  return query;
};

const buildConditions = (filters: Record<string, any>): string[] => {
  const conditions: string[] = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;

    if (Array.isArray(value) && value.length) {
      const arrQuery = buildArrayQuery(value);
      if (arrQuery) conditions.push(arrQuery);
    }

    if (key === "date_gte") {
      conditions.push(`publication_date:[${formatDate(value)} TO *]`);
    }

    if (key === "date_lte") {
      conditions.push(`publication_date:[* TO ${formatDate(value)}]`);
    }
  });

  return conditions;
};

const buildArrayQuery = (items: string[]): string | null => {
  return items.length ? `(${items.join(" OR ")})` : null;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const fetchZenodoData = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Error fetching Zenodo data: ${res.statusText}`);
  }

  return res.json();
};

const parseZenodoRecords = (json: any) => {
  return (json.hits?.hits ?? []).map((r: any) => ({
    title: r.metadata?.title,
    description: r.metadata?.description ?? "",
    publication_date: r.metadata?.publication_date,
    version: r.metadata?.version ?? "1.0",
    tags: r.metadata?.keywords ?? [],
    license: r.metadata?.license?.id ?? "Desconhecida",
    files: (r.files ?? []).map((f: any) => ({
      name: f.key,
      downloadUrl: f.links.self,
    })),
  }));
};
