import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import HubTemplate from "@/templates/HubTemplate";
import { buildMetadata } from "@/config/seo";
import { getSearchIndex } from "@/features/search/contentful";
import {
  getSearchGroupKey,
  getSearchTypeLabel,
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
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] || "" : q || "";
  const normalizedQuery = normalizeSearchText(query);
  const canSearch = normalizedQuery.length >= MIN_SEARCH_QUERY_LENGTH;
  const index = canSearch ? await getSearchIndex() : null;
  const results = index
    ? searchItems(index.items, query, { limit: SEARCH_PAGE_LIMIT })
    : [];
  const groups = groupResults(results);

  return (
    <HubTemplate>
      <section className="flex w-full max-w-[1440px] flex-col gap-8 px-6 py-12 lg:px-20">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold text-grey-1100">Busca</h1>
          <SearchBar initialQuery={query} variant="page" />
        </div>

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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((result) => (
          <SearchResultCard key={result.id} result={result} />
        ))}
      </div>
    </section>
  );
};

const SearchResultCard = ({ result }: { result: SearchResult }) => (
  <Link
    className="group flex min-h-[168px] overflow-hidden rounded-md border border-grey-200 bg-white shadow-sm transition hover:border-grey-300 hover:bg-grey-100"
    href={result.href}
  >
    {result.thumb && (
      <div className="hidden w-32 shrink-0 overflow-hidden bg-grey-100 sm:block">
        <Image
          alt=""
          className="h-full w-full object-cover transition group-hover:scale-105"
          height={168}
          src={result.thumb}
          width={128}
        />
      </div>
    )}

    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-sm bg-green-neutro px-2 py-1 text-xs font-semibold text-green-900">
          {getSearchTypeLabel(result)}
        </span>
        {result.date && (
          <span className="text-xs text-grey-600">
            {new Date(result.date).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="line-clamp-2 text-base font-semibold text-grey-1100">
          {result.title}
        </h3>
        {result.description && (
          <p className="line-clamp-3 text-sm leading-5 text-grey-700">
            {result.description}
          </p>
        )}
      </div>

      {result.themes.length > 0 && (
        <p className="mt-auto line-clamp-1 text-xs font-medium text-green-900">
          {result.themes.join(", ")}
        </p>
      )}
    </div>
  </Link>
);

const SearchEmptyState = ({ message }: { message: string }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-md bg-grey-100 px-6 py-12 text-center text-grey-700">
    {message}
  </div>
);
