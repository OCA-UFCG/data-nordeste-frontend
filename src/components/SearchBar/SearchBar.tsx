"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SEARCH_LIMIT,
  getSearchTypeLabel,
  MIN_SEARCH_QUERY_LENGTH,
  normalizeSearchText,
  searchItems,
} from "@/features/search/search";
import type { SearchIndex, SearchIndexItem } from "@/features/search/types";

type SearchBarProps = {
  autoFocus?: boolean;
  className?: string;
  initialQuery?: string;
  onNavigate?: () => void;
  variant?: "header" | "mobile" | "page";
};

const SEARCH_INDEX_URL = "/search-index.json";

export const SearchBar = ({
  autoFocus,
  className,
  initialQuery = "",
  onNavigate,
  variant = "header",
}: SearchBarProps) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<SearchIndexItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const requestRef = useRef<Promise<void> | null>(null);
  const inputId = useId();

  const normalizedQuery = normalizeSearchText(query);
  const canSearch = normalizedQuery.length >= MIN_SEARCH_QUERY_LENGTH;
  const suggestions = useMemo(
    () =>
      items && canSearch
        ? searchItems(items, query, { limit: DEFAULT_SEARCH_LIMIT })
        : [],
    [canSearch, items, query],
  );

  const loadIndex = useCallback(async () => {
    if (items || requestRef.current) return requestRef.current;

    setStatus("loading");
    requestRef.current = fetch(SEARCH_INDEX_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Search index request failed: ${response.status}`);
        }

        const index = (await response.json()) as SearchIndex;
        setItems(index.items || []);
        setStatus("idle");
      })
      .catch(() => {
        setStatus("error");
      })
      .finally(() => {
        requestRef.current = null;
      });

    return requestRef.current;
  }, [items]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSearch) return;

    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setOpen(true);

    if (normalizeSearchText(value).length >= MIN_SEARCH_QUERY_LENGTH) {
      void loadIndex();
    }
  };

  const showPanel = open && (canSearch || status === "loading");

  return (
    <form
      role="search"
      className={cn(
        "relative w-full",
        variant === "header" && "max-w-[320px]",
        variant === "page" && "max-w-3xl",
        className,
      )}
      onBlur={() => {
        window.setTimeout(() => setOpen(false), 150);
      }}
      onSubmit={submitSearch}
    >
      <label className="sr-only" htmlFor={inputId}>
        Buscar conteúdo
      </label>
      <div
        className={cn(
          "flex h-10 items-center gap-2 rounded-md border border-grey-300 bg-white px-3 transition focus-within:border-green-800 focus-within:ring-2 focus-within:ring-green-800/20",
          variant === "page" && "h-12 px-4",
        )}
      >
        <Search className="size-4 text-grey-600" aria-hidden="true" />
        <input
          autoComplete="off"
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent text-sm text-grey-1100 outline-none placeholder:text-grey-600"
          id={inputId}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => {
            setOpen(true);
            void loadIndex();
          }}
          placeholder="Buscar conteúdo"
          type="search"
          value={query}
        />
        <button
          aria-label="Buscar"
          className="flex size-7 items-center justify-center rounded-md text-green-900 transition hover:bg-green-neutro disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canSearch}
          type="submit"
        >
          <Search className="size-4" aria-hidden="true" />
        </button>
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-grey-200 bg-white shadow-lg">
          {status === "loading" && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-grey-700">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Carregando resultados
            </div>
          )}

          {status === "error" && (
            <div className="px-4 py-3 text-sm text-red-700">
              Não foi possível carregar a busca
            </div>
          )}

          {status !== "loading" && status !== "error" && canSearch && (
            <>
              {suggestions.length > 0 ? (
                <div className="max-h-[360px] overflow-auto py-2">
                  {suggestions.map((item) => (
                    <Link
                      className="flex flex-col gap-1 px-4 py-3 text-left transition hover:bg-green-neutro focus:bg-green-neutro focus:outline-none"
                      href={item.href}
                      key={item.id}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                    >
                      <span className="text-xs font-semibold text-green-900">
                        {getSearchTypeLabel(item)}
                      </span>
                      <span className="line-clamp-1 text-sm font-semibold text-grey-1100">
                        {item.title}
                      </span>
                      {(item.description || item.themes.length > 0) && (
                        <span className="line-clamp-1 text-xs text-grey-700">
                          {item.description || item.themes.join(", ")}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-grey-700">
                  Nenhum resultado encontrado
                </div>
              )}

              <Link
                className="flex items-center justify-between border-t border-grey-200 px-4 py-3 text-sm font-semibold text-green-900 transition hover:bg-green-neutro focus:bg-green-neutro focus:outline-none"
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
              >
                Ver todos os resultados
                <Search className="size-4" aria-hidden="true" />
              </Link>
            </>
          )}
        </div>
      )}
    </form>
  );
};
