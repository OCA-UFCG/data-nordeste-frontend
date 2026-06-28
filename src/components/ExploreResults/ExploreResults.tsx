"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { IPageHeader } from "@/utils/interfaces";
import {
  resolveExploreTab,
  type ExploreResults as ExploreResultsState,
  type ExploreTab,
} from "@/features/explore/contract";
import { useExploreNavigation } from "@/features/explore/navigation";
import { useLocalExploreIndex } from "@/features/explore/useLocalExploreIndex";
import { MacroThemeTabs } from "@/components/MacroThemeTabs/MacroThemeTabs";
import { PostsGrid } from "@/components/PostsGrid/PostsGrid";

type ExploreHeaders = {
  dashboards?: IPageHeader;
  datastories?: IPageHeader;
  publications?: IPageHeader;
};

const TYPE_BY_TAB: Record<ExploreTab, string> = {
  paineis: "data-panel",
  datastories: "data-story",
  boletins: "newsletter,additional-content",
};

function ResultsTabs({
  activeTab,
  headers,
  results,
}: {
  activeTab: ExploreTab;
  headers: ExploreHeaders;
  results: ExploreResultsState;
}) {
  return (
    <MacroThemeTabs
      dashboards={[]}
      datastories={[]}
      publicacoes={[]}
      headers={headers}
      urls={{ dashboardsHref: "", datastoriesHref: "", postsByThemeHref: "" }}
      tabsOnly
      showHeaderInTabsOnly
      showViewAll={false}
      activeTab={activeTab}
      tabTotals={results.tabTotals}
      clientSideNavigation
    />
  );
}

function ResultsGrid({
  currentPage,
  error,
  loading,
  onRetry,
  results,
  searchQuery,
}: {
  currentPage: number;
  error: boolean;
  loading: boolean;
  onRetry: () => void;
  results: ExploreResultsState;
  searchQuery?: string;
}) {
  return (
    <section className="w-full bg-[#F8F7F8] py-9">
      <div className="flex w-full max-w-[1440px] flex-col items-center gap-4 px-4 mx-auto sm:px-20">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 self-start text-sm text-red-700"
          >
            <span>Não foi possível atualizar os resultados.</span>
            <button className="font-medium underline" onClick={onRetry}>
              Tentar novamente
            </button>
          </div>
        )}
        <PostsGrid
          currentPage={currentPage}
          pages={Math.max(results.totalPages, 1)}
          posts={results.items}
          loading={loading}
          preservePostsWhileLoading
          clientSidePagination
          searchQuery={searchQuery}
        />
      </div>
    </section>
  );
}

/** Renders locally refreshed explore tabs and cards. Example: `<ExploreResults initialResults={result} headers={{}} />`. */
export function ExploreResults({
  headers,
  initialResults,
}: {
  headers: ExploreHeaders;
  initialResults: ExploreResultsState;
}) {
  const params = useSearchParams();
  const { replaceQuery } = useExploreNavigation();
  const paramsKey = params.toString();
  const requestedTab = resolveExploreTab(params.get("type_in"));
  const state = useLocalExploreIndex(initialResults, paramsKey);
  const activeTab = state.activeTab ?? requestedTab;
  const requestedPage = Math.max(1, Number(params.get("page")) || 1);
  const currentPage = state.currentPage ?? requestedPage;

  useEffect(() => {
    if (!state.activeTab || state.activeTab === requestedTab) return;

    replaceQuery({ type_in: TYPE_BY_TAB[state.activeTab], page: "1" });
  }, [replaceQuery, requestedTab, state.activeTab]);

  useEffect(() => {
    if (!state.currentPage || state.currentPage === requestedPage) return;

    replaceQuery({ page: state.currentPage.toString() });
  }, [replaceQuery, requestedPage, state.currentPage]);

  return (
    <>
      <ResultsTabs
        activeTab={activeTab}
        headers={headers}
        results={state.results}
      />
      <ResultsGrid
        currentPage={currentPage}
        error={state.error}
        loading={false}
        onRetry={state.retry}
        results={state.results}
        searchQuery={params.get("q") ?? undefined}
      />
    </>
  );
}
