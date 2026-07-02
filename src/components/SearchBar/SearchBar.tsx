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
import { Loader2, Search, X } from "lucide-react";
import { Icon } from "@/components/Icon/Icon";
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
  hideViewAll?: boolean;
  filterItems?: (item: SearchIndexItem) => boolean;
  onSubmit?: (query: string) => void;
  onQueryChange?: (query: string) => void;
  hideSuggestions?: boolean;
};

export const SearchBar = ({
  autoFocus,
  className,
  initialQuery = "",
  onNavigate,
  placeholder = "Digite sua pesquisa",
  variant = "header",
  hideViewAll = false,
  filterItems,
  onSubmit,
  onQueryChange,
  hideSuggestions = false,
}: SearchBarProps) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<SearchIndexItem[] | null>(() =>
    getCachedSearchIndexItems(),
  );
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const isMountedRef = useRef(true);
  const pendingUpdate = useRef<ReturnType<typeof setTimeout>>();
  const inputId = useId();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (pendingUpdate.current) clearTimeout(pendingUpdate.current);
    };
  }, []);

  const normalizedQuery = normalizeSearchText(query);
  const canSearch = normalizedQuery.length >= MIN_SEARCH_QUERY_LENGTH;
  const suggestions = useMemo(() => {
    if (!items || !canSearch) return [];
    const filteredItems = filterItems ? items.filter(filterItems) : items;

    return searchItems(filteredItems, query, { limit: DEFAULT_SEARCH_LIMIT });
  }, [canSearch, items, query, filterItems]);

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
    if (pendingUpdate.current) clearTimeout(pendingUpdate.current);

    setOpen(false);
    onNavigate?.();
    if (onSubmit) {
      onSubmit(query.trim());
    } else {
      if (!query.trim()) return;
      router.push(buildExploreSearchHref(query));
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setOpen(true);

    if (
      !hideSuggestions &&
      normalizeSearchText(value).length >= MIN_SEARCH_QUERY_LENGTH
    ) {
      void loadIndex();
    }

    if (onQueryChange) {
      if (pendingUpdate.current) clearTimeout(pendingUpdate.current);
      pendingUpdate.current = setTimeout(() => {
        onQueryChange(value.trim());
      }, 300);
    }
  };

  const showPanel =
    !hideSuggestions && open && (canSearch || status === "loading");

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
        "relative",
        variant === "header" &&
          "max-w-[407px] transition-[max-width] duration-200 focus-within:max-w-none",
        variant === "page" && "w-full max-w-[961px]",
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
          "flex items-center justify-end h-10 w-full gap-2 rounded-lg bg-[#EFEFEF] px-3 py-[6px] transition-colors focus-within:bg-[#E8E7E8]",
          variant === "header" &&
            "h-[47px] bg-[#F8F7F8] px-4 focus-within:border focus-within:border-[#018F39] focus-within:bg-[#F8F7F8]",
          variant === "page" && "h-10",
        )}
      >
        <input
          autoComplete="off"
          autoFocus={autoFocus}
          className="min-w-0 flex-1 appearance-none bg-transparent px-1 text-sm font-normal leading-5 text-[#292829] outline-none placeholder:text-[#292829] placeholder:font-normal placeholder:text-sm placeholder:leading-5 [&::-webkit-search-cancel-button]:hidden"
          id={inputId}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => {
            setOpen(true);
            if (!hideSuggestions) void loadIndex();
          }}
          placeholder={placeholder}
          type="search"
          value={query}
        />
        {query && (
          <button
            aria-label="Limpar pesquisa"
            className="flex size-3 shrink-0 items-center justify-center text-[#292829]"
            onClick={() => handleQueryChange("")}
            type="button"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        )}
        <button
          aria-label="Buscar"
          className="flex size-4 shrink-0 items-center justify-center text-[#018F39]"
          type="submit"
        >
          <Icon
            id="search-icon"
            width={variant === "header" ? 16 : 12}
            height={variant === "header" ? 16 : 12}
            aria-hidden="true"
          />
        </button>
      </div>

      {showPanel && (
        <div
          className={cn(
            "overflow-hidden rounded-lg bg-white pt-1.5 shadow-lg",
            variant === "mobile"
              ? "relative mt-3"
              : "absolute left-0 right-0 top-full z-50 mt-1",
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
                <div className="max-h-[360px] overflow-auto px-1">
                  {suggestions.map((item) => (
                    <Link
                      className="flex h-8 min-w-32 items-center gap-2 px-2 py-1.5 text-left transition hover:bg-green-neutro focus:bg-green-neutro focus:outline-none"
                      href={item.href}
                      key={item.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setQuery(item.title);
                        setOpen(false);
                        onNavigate?.();
                      }}
                    >
                      <Search
                        className="size-4 shrink-0 text-[#292829]"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-normal leading-5 text-[#292829]">
                        {item.title}
                      </span>
                      <span className="shrink-0 rounded-full border border-[#EFEFEF] bg-[#EFEFEF] px-2.5 py-0.5 text-xs font-semibold leading-4 text-[#292829]">
                        {getSearchTypeLabel(item)}
                      </span>
                      {item.description && (
                        <span className="sr-only">{item.description}</span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-grey-700">
                  Nenhum resultado encontrado
                </div>
              )}

              {!hideViewAll && (
                <Link
                  className="flex h-9 items-center justify-between border-t border-[#EDEDED] px-4 py-2 text-sm font-normal leading-5 text-[#018F39] transition hover:bg-green-neutro focus:bg-green-neutro focus:outline-none"
                  href={buildExploreSearchHref(query)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                >
                  Ver todos os resultados
                  <Search className="size-4" aria-hidden="true" />
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </form>
  );
};

const buildExploreSearchHref = (query: string): string => {
  const searchParams = new URLSearchParams({ q: query.trim(), page: "1" });

  return `/explore?${searchParams.toString()}`;
};
