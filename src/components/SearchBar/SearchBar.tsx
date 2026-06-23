"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FocusEvent,
  FormEvent,
  useCallback,
  useEffect,
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
import {
  getCachedSearchIndexItems,
  loadSearchIndexItems,
} from "@/features/search/clientIndex";
import type { SearchIndexItem } from "@/features/search/types";

type SearchBarProps = {
  autoFocus?: boolean;
  className?: string;
  initialQuery?: string;
  onNavigate?: () => void;
  placeholder?: string;
  variant?: "header" | "mobile" | "page";
};

export const SearchBar = ({
  autoFocus,
  className,
  initialQuery = "",
  onNavigate,
  placeholder = "Buscar conteúdo",
  variant = "header",
}: SearchBarProps) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<SearchIndexItem[] | null>(() =>
    getCachedSearchIndexItems(),
  );
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const isMountedRef = useRef(true);
  const inputId = useId();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
    if (items) {
      setStatus("idle");

      return items;
    }

    setStatus("loading");
    try {
      const nextItems = await loadSearchIndexItems();

      if (!isMountedRef.current) return nextItems;

      setItems(nextItems);
      setStatus("idle");

      return nextItems;
    } catch {
      if (isMountedRef.current) {
        setStatus("error");
      }

      return null;
    }
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

  const handleBlur = (event: FocusEvent<HTMLFormElement>) => {
    const nextFocused = event.relatedTarget;

    if (
      nextFocused instanceof Node &&
      event.currentTarget.contains(nextFocused)
    ) {
      return;
    }

    setOpen(false);
  };

  return (
    <form
      role="search"
      className={cn(
        "relative w-full",
        variant === "header" && "max-w-[407px]",
        variant === "page" && "max-w-3xl",
        className,
      )}
      onBlur={handleBlur}
      onSubmit={submitSearch}
    >
      <label className="sr-only" htmlFor={inputId}>
        Buscar conteúdo
      </label>
      <div
        className={cn(
          "rounded-lg bg-[#F8F7F8] px-2 transition-colors focus-within:bg-[#F2F1F2]",
          variant === "page" && "px-3",
        )}
      >
        <div
          className={cn(
            "flex h-[47px] items-center gap-2 px-2 py-1.5",
            variant === "page" && "h-[51px]",
          )}
        >
          <Search className="size-4 text-[#292829]" aria-hidden="true" />
          <input
            autoComplete="off"
            autoFocus={autoFocus}
            className="min-w-0 flex-1 bg-transparent text-sm font-normal leading-5 text-[#292829] outline-none placeholder:text-[#292829]"
            id={inputId}
            onChange={(event) => handleQueryChange(event.target.value)}
            onFocus={() => {
              setOpen(true);
              void loadIndex();
            }}
            placeholder={placeholder}
            type="search"
            value={query}
          />
          <button
            aria-label="Buscar"
            className="flex size-4 items-center justify-center text-[#292829] transition hover:text-green-900 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canSearch}
            type="submit"
          >
            <Search className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {showPanel && (
        <div
          className={cn(
            "overflow-hidden rounded-md border border-grey-200 bg-white shadow-lg",
            variant === "mobile"
              ? "relative mt-3"
              : "absolute left-0 right-0 top-full z-50 mt-2",
          )}
        >
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
