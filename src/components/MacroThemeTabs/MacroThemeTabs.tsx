"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { IPublication, IPageHeader } from "@/utils/interfaces";
import ContentPost from "../ContentPost/ContentPost";
import { LinkButton } from "@/components/LinkButton/LinkButton";
import { Icon } from "@/components/Icon/Icon";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

type MacroThemeTabsProps = {
  dashboards: IPublication[];
  datastories: IPublication[];
  publicacoes: IPublication[];
  headers: {
    dashboards?: IPageHeader;
    datastories?: IPageHeader;
    publications?: IPageHeader;
  };
  urls: {
    dashboardsHref: string;
    datastoriesHref: string;
    postsByThemeHref: string;
  };
  showViewAll?: boolean;
  tabsOnly?: boolean;
  showHeaderInTabsOnly?: boolean;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
};

export type TabType = "paineis" | "datastories" | "boletins";

export function MacroThemeTabs({
  dashboards,
  datastories,
  publicacoes,
  headers,
  urls,
  showViewAll = true,
  tabsOnly = false,
  showHeaderInTabsOnly = false,
  activeTab: controlledActiveTab,
  onTabChange,
}: MacroThemeTabsProps) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawTypeIn = params.get("type_in") ?? "";

  const deriveTabFromUrl = (): TabType =>
    rawTypeIn === "data-panel"
      ? "paineis"
      : rawTypeIn === "data-story"
        ? "datastories"
        : rawTypeIn.includes(",")
          ? "boletins"
          : "paineis";

  const [internalActiveTab, setInternalActiveTab] =
    useState<TabType>("paineis");
  const activeTab = tabsOnly
    ? deriveTabFromUrl()
    : controlledActiveTab ?? internalActiveTab;

  const handleTabClick = (tab: TabType) => {
    if (tabsOnly) {
      const typeInMap: Record<TabType, string> = {
        paineis: "data-panel",
        datastories: "data-story",
        boletins: "newsletter,additional-content",
      };
      const newParams = new URLSearchParams(params.toString());
      newParams.set("type_in", typeInMap[tab]);
      newParams.delete("page");
      router.replace(pathname + "?" + newParams.toString());
    } else if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const renderHeader = (
    header: IPageHeader | undefined,
    defaultTitle: string,
  ) => (
    <div className="flex flex-col gap-2">
      <h2 className="text-[30px] font-semibold leading-[36px] tracking-[-0.0075em] text-[#292829]">
        {header?.title || defaultTitle}
      </h2>
      {header && (
        <>
          {header.richSubtitle?.json ? (
            <div className="text-[16px] font-normal leading-6 text-[#292829] [&_a]:font-medium [&_a]:text-[#077432] [&_a]:underline-offset-2 [&_a:hover]:underline [&_p]:mb-0 [&_p]:mt-0">
              {documentToReactComponents(header.richSubtitle.json)}
            </div>
          ) : header.subtitle ? (
            <p className="text-[16px] font-normal leading-6 text-[#292829]">
              {header.subtitle}
            </p>
          ) : null}
        </>
      )}
    </div>
  );

  const renderTabSection = (
    items: IPublication[],
    header: IPageHeader | undefined,
    defaultTitle: string,
    href: string,
    emptyMessage: string,
  ) => {
    return (
      <section className="animate-in fade-in duration-300 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          {renderHeader(header, defaultTitle)}
          {showViewAll && items.length > 0 && (
            <LinkButton
              href={href}
              variant="secondary"
              className="w-fit shrink-0"
            >
              <p>Ver Todos</p>
              <Icon className="rotate-270 size-2" id="expand" />
            </LinkButton>
          )}
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((post, i) => (
              <ContentPost content={post} key={i} />
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-500">
            <p>{emptyMessage}</p>
          </div>
        )}
      </section>
    );
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "paineis", label: "Painéis" },
    { key: "datastories", label: "Datastories" },
    { key: "boletins", label: "Boletins" },
  ];

  return (
    <div className="w-full">
      <div className="w-full bg-white border-b border-[#BEBBBD]">
        <div
          role="tablist"
          className="flex flex-row items-stretch gap-4 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-0 overflow-x-auto scrollbar-hide"
          style={{ height: "60px" }}
        >
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => handleTabClick(key)}
              style={{ padding: "0 12px" }}
              className={`h-full whitespace-nowrap flex items-center justify-center font-medium text-[14px] leading-5 transition-colors border-b-2 outline-none focus-visible:ring-2 focus-visible:ring-[#018F39] ${
                activeTab === key
                  ? "border-[#018F39] text-[#018F39] drop-shadow-sm"
                  : "border-transparent text-[#7E797B] hover:text-[#292829] hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tabsOnly && showHeaderInTabsOnly && (
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-20 pt-8 pb-0">
          {activeTab === "paineis" &&
            renderHeader(headers.dashboards, "Painel de Dados")}
          {activeTab === "datastories" &&
            renderHeader(headers.datastories, "Narrativa de Dados")}
          {activeTab === "boletins" &&
            renderHeader(headers.publications, "Publicações")}
        </div>
      )}

      {!tabsOnly && (
        <div
          role="tabpanel"
          tabIndex={0}
          className="outline-none w-full max-w-[1440px] mx-auto px-20 pt-8 pb-10"
        >
          {activeTab === "paineis" &&
            renderTabSection(
              dashboards,
              headers.dashboards,
              "Painel de Dados",
              urls.dashboardsHref,
              "Ainda não há painéis publicados para este macrotema.",
            )}
          {activeTab === "datastories" &&
            renderTabSection(
              datastories,
              headers.datastories,
              "Narrativa de Dados",
              urls.datastoriesHref,
              "Ainda não há datastories publicados para este macrotema.",
            )}
          {activeTab === "boletins" &&
            renderTabSection(
              publicacoes,
              headers.publications,
              "Publicações",
              urls.postsByThemeHref,
              "Ainda não há boletins/publicações para este macrotema.",
            )}
        </div>
      )}
    </div>
  );
}
