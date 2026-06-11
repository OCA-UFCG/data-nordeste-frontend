import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon/Icon";
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

const SearchResultCard = ({ result }: { result: SearchResult }) => {
  const isNewsletter = result.type === "newsletter";
  const isPdf = result.href.toLowerCase().includes(".pdf");

  return (
    <Link
      className="group flex h-full w-full flex-col overflow-hidden rounded-md border border-grey-200 bg-grey-100 shadow-md transition duration-300 hover:border-grey-300 hover:bg-grey-200"
      href={result.href}
      data-pdf={isPdf || isNewsletter ? "true" : undefined}
    >
      {result.thumb && (
        <div className="w-full overflow-hidden">
          <Image
            alt=""
            className="block aspect-7/4 w-full object-cover object-top transition-transform duration-300 group-hover:scale-102"
            height={300}
            src={result.thumb}
            width={300}
          />
        </div>
      )}

      {!result.thumb && <div className="aspect-7/4 w-full bg-grey-200" />}

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex flex-row items-center justify-between bg-gray-200 px-5 py-1">
          <p className="text-xs font-semibold text-grey-1100">
            {getSearchTypeLabel(result)}
          </p>
          {result.date && (
            <p className="text-xs text-grey-600">
              {new Date(result.date).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>

        <div className="flex h-full items-center justify-between gap-3 px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="line-clamp-2 text-sm font-medium text-grey-1100">
              {result.title}
            </p>

            {(result.description || result.themes.length > 0) && (
              <p className="line-clamp-2 text-xs text-grey-700">
                {result.description || result.themes.join(", ")}
              </p>
            )}
          </div>

          <Icon
            className="size-2 min-w-2 rotate-270 md:flex"
            id="expand"
            size={9}
          />
        </div>
      </div>
    </Link>
  );
};

const SearchEmptyState = ({ message }: { message: string }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-md bg-grey-100 px-6 py-12 text-center text-grey-700">
    {message}
  </div>
);
