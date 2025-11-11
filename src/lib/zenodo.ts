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

const buildConditions = (filters: Record<string, any>) => {
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
