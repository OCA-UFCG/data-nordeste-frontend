export async function getZenodoCommunityRecords(
  page: number,
  size: number,
  filters: Record<string, any> = {},
) {
  const query = new URLSearchParams({
    communities: "datane",
    size: size.toString(),
    page: page.toString(),
  });

  if (filters.sort) {
    query.append("sort", filters.sort);
  }

  const conditions: string[] = [];
  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const buildArrayQuery = (items: string[]) =>
    items.length ? `(${items.join(" OR ")})` : null;

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;

    if (Array.isArray(value) && value.length) {
      if (["sort", "date_gte", "date_lte"].includes(key)) return;

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

  if (conditions.length) {
    query.append("q", conditions.join(" AND "));
  }

  const url = `https://zenodo.org/api/records?${query.toString()}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Error: ${res.statusText}`);
  }

  const json = await res.json();

  const records = (json.hits?.hits ?? []).map((r: any) => ({
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

  return {
    records,
    totalPages: Math.ceil(json.hits.total / size),
    currentPage: page,
  };
}
