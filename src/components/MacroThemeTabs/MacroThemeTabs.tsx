"use client";

import { useState } from "react";
import { IPublication, IPageHeader } from "@/utils/interfaces";
import { CardCarousel } from "@/components/CardCarousel/CardCarousel";
import { LinkButton } from "@/components/LinkButton/LinkButton";
import { Icon } from "@/components/Icon/Icon";
import { InfoTooltip } from "@/components/InfoTooltip/InfoTooltip";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

interface MacroThemeTabsProps {
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
}

type TabType = "paineis" | "datastories" | "boletins";

export function MacroThemeTabs({
  dashboards,
  datastories,
  publicacoes,
  headers,
  urls,
}: MacroThemeTabsProps) {
  // Aba padrão inicial como "paineis"
  const [activeTab, setActiveTab] = useState<TabType>("paineis");

  const renderTooltipContent = (header?: IPageHeader) => {
    if (header?.richSubtitle?.json) {
      return (
        <div className="text-[16px] leading-6 text-[#292829] [&_a]:font-medium [&_a]:text-[#077432] [&_a]:underline-offset-2 [&_a:hover]:underline [&_p]:mb-6 [&_p:last-child]:mb-0">
          {documentToReactComponents(header.richSubtitle.json)}
        </div>
      );
    }
    if (header?.subtitle) {
      return (
        <p className="text-[16px] leading-6 text-[#292829]">
          {header.subtitle}
        </p>
      );
    }

    return null;
  };

  // Função auxiliar para renderizar o conteúdo da aba ativa
  const renderTabSection = (
    items: IPublication[],
    header: IPageHeader | undefined,
    defaultTitle: string,
    href: string,
    emptyMessage: string,
  ) => {
    return (
      <section className="space-y-6 mt-8 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">
              {header?.title || defaultTitle}
            </h2>
            {header && (
              <InfoTooltip
                label={`Saiba mais sobre ${header.title}`}
                title={header.subtitle || "Saiba mais"}
                content={renderTooltipContent(header)}
              />
            )}
          </div>

          {items.length > 0 && (
            <LinkButton href={href} variant="secondary" className="w-fit">
              <p>Ver Todos</p>
              <Icon className="rotate-270 size-2" id="expand" />
            </LinkButton>
          )}
        </div>

        {items.length > 0 ? (
          <CardCarousel items={items} variant="post" />
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-500">
            <p>{emptyMessage}</p>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-10">
      {/* Navegação das Abas com scroll horizontal em dispositivos móveis */}
      <div
        className="flex overflow-x-auto gap-4 border-b border-gray-200 pb-2 scrollbar-hide"
        role="tablist"
      >
        <button
          role="tab"
          aria-selected={activeTab === "paineis"}
          onClick={() => setActiveTab("paineis")}
          className={`whitespace-nowrap px-4 py-2 font-medium text-lg transition-colors border-b-2 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === "paineis"
              ? "border-[#077432] text-[#077432]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Painéis
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "datastories"}
          onClick={() => setActiveTab("datastories")}
          className={`whitespace-nowrap px-4 py-2 font-medium text-lg transition-colors border-b-2 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === "datastories"
              ? "border-[#077432] text-[#077432]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Datastories
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "boletins"}
          onClick={() => setActiveTab("boletins")}
          className={`whitespace-nowrap px-4 py-2 font-medium text-lg transition-colors border-b-2 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === "boletins"
              ? "border-[#077432] text-[#077432]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Boletins
        </button>
      </div>

      {/* Renderização condicional do conteúdo sem recarregar a página */}
      <div role="tabpanel" tabIndex={0} className="outline-none">
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
    </div>
  );
}
