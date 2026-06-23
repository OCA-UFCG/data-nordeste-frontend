import { SearchResultCard } from "@/components/SearchResultCard/SearchResultCard";
import HubTemplate from "@/templates/HubTemplate";
import { buildMetadata } from "@/config/seo";
import { getSearchIndex } from "@/features/search/contentful";
import {
  getSearchGroupKey,
  MIN_SEARCH_QUERY_LENGTH,
  normalizeSearchText,
  searchItems,
} from "@/features/search/search";
import type { SearchResult } from "@/features/search/types";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Busca",
  description:
    "Busca de conteúdos, painéis, datastories, publicações e macrotemas do Data Nordeste.",
  path: "/search",
});

const SEARCH_PAGE_LIMIT = 100;

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    type?: string | string[];
    themes?: string | string[];
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type, themes } = await searchParams;
  const query = Array.isArray(q) ? q[0] || "" : q || "";
  const normalizedQuery = normalizeSearchText(query);
  const canSearch = normalizedQuery.length >= MIN_SEARCH_QUERY_LENGTH;
  const index = canSearch ? await getSearchIndex() : null;
  let results = index
    ? searchItems(index.items, query, { limit: SEARCH_PAGE_LIMIT })
    : [];

  if (type === "panels") {
    results = results.filter((r) =>
      ["data-panel", "data-panel-detail"].includes(r.type),
    );
  }

  const selectedThemes = typeof themes === "string" ? themes.split(",") : [];
  if (selectedThemes.length > 0) {
    results = results.filter((r) =>
      r.themes?.some((t) => selectedThemes.includes(t)),
    );
  }
  const groups = groupResults(results);

  return (
    <HubTemplate>
      <section className="flex w-full max-w-[1440px] flex-col gap-8 px-6 py-12 lg:px-20">
        <h1 className="text-3xl font-semibold text-grey-1100">Busca</h1>

        {!canSearch ? (
          <SearchEmptyState message="Digite ao menos 2 caracteres para buscar." />
        ) : results.length === 0 ? (
          <SearchEmptyState
            message={`Nenhum resultado encontrado para "${query}".`}
          />
        ) : (
          <div className="flex flex-col gap-10">
            <p className="text-sm text-grey-700">
              {results.length} resultado{results.length === 1 ? "" : "s"} para
              &quot;{query}&quot;
            </p>

            <SearchResultGroup results={groups.panels} title="Painéis" />
            <SearchResultGroup
              results={groups.content}
              title="Datastories e publicações"
            />
            <SearchResultGroup results={groups.themes} title="Macrotemas" />
          </div>
        )}
      </section>
    </HubTemplate>
  );
}

const groupResults = (results: SearchResult[]) =>
  results.reduce(
    (groups, result) => {
      groups[getSearchGroupKey(result)].push(result);

      return groups;
    },
    {
      content: [] as SearchResult[],
      panels: [] as SearchResult[],
      themes: [] as SearchResult[],
    },
  );

const SearchResultGroup = ({
  results,
  title,
}: {
  results: SearchResult[];
  title: string;
}) => {
  if (!results.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-grey-1100">{title}</h2>
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((result) => (
          <SearchResultCard key={result.id} result={result} />
        ))}
      </div>
    </section>
  );
};

const SearchEmptyState = ({ message }: { message: string }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-md bg-grey-100 px-6 py-12 text-center text-grey-700">
    {message}
  </div>
);
