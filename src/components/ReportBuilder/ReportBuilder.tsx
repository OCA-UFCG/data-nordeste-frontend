"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon/Icon";
import ThemeFilterCard from "@/components/ExploreFilters/ThemeFilterCard";
import {
  ReportPreview,
  type ReportPreviewDocument,
} from "@/components/ReportBuilder/ReportPreview";
import { cn } from "@/lib/utils";
import {
  MACROTHEME_ICON_BY_ID,
  THEMES_NAVIGATION_ORDER,
} from "@/features/macrothemes/constants";
import {
  buildReportProxyUrl,
  getAutomaticReportSlug,
  type AutomaticReportMacrothemeSlug,
} from "@/features/reports/automaticReport";
import { normalizeKey, sortContentByDesiredOrder } from "@/utils/functions";
import type { MacroTheme } from "@/utils/interfaces";

type ReportTheme = Pick<MacroTheme, "id" | "name" | "color" | "sys">;
type ReportMobileTab = "config" | "report";

type ReportBuilderProps = {
  themes: ReportTheme[];
};

/** Renders the automatic report form. Example: `<ReportBuilder themes={themes} />`. */
export function ReportBuilder({ themes }: ReportBuilderProps): ReactElement {
  const [municipality, setMunicipality] = useState("");
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingCities, setLoadingCities] = useState(false);
  const [reportPreview, setReportPreview] =
    useState<ReportPreviewDocument | null>(null);

  const [activeTab, setActiveTab] = useState<ReportMobileTab>("config");
  const sortedThemes = useMemo(() => sortThemes(themes), [themes]);
  const supportedThemeIds = useMemo(
    () => getSupportedThemeIds(themes),
    [themes],
  );
  const allThemesSelected = hasSelectedAllThemes(
    selectedThemeIds,
    supportedThemeIds,
  );

  useEffect(() => {
    void loadReportCities(setCities, setLoadingCities, setErrorMessage);
  }, []);

  const toggleTheme = (themeId: string): void => {
    if (!getAutomaticReportSlug(themeId)) return;
    setSelectedThemeIds((currentIds) =>
      toggleThemeId(currentIds, themeId, supportedThemeIds),
    );
  };

  const selectEveryTheme = (): void => {
    setSelectedThemeIds(supportedThemeIds);
  };

  const clearSelectedThemes = (): void => {
    setSelectedThemeIds([]);
  };

  const generateReport = (): void => {
    const request = buildReportRequest(municipality, selectedThemeIds);
    if (!request) {
      setErrorMessage("Selecione um município e um macrotema disponível.");

      return;
    }

    setErrorMessage("");
    setReportPreview({
      fileName: buildReportFileName(request.city),
      url: buildReportProxyUrl(request),
    });
  };

  return (
    <ReportBuilderLayout
      activeTab={activeTab}
      allThemesSelected={allThemesSelected}
      cities={cities}
      errorMessage={errorMessage}
      loadingCities={loadingCities}
      municipality={municipality}
      onClear={clearSelectedThemes}
      onGenerate={generateReport}
      onMunicipalityChange={setMunicipality}
      onSelectAll={selectEveryTheme}
      onTabChange={setActiveTab}
      onToggleTheme={toggleTheme}
      reportPreview={reportPreview}
      selectedThemeIds={selectedThemeIds}
      themes={sortedThemes}
    />
  );
}

function ReportBuilderLayout({
  activeTab,
  allThemesSelected,
  cities,
  errorMessage,
  loadingCities,
  municipality,
  onClear,
  onGenerate,
  onMunicipalityChange,
  onSelectAll,
  onTabChange,
  onToggleTheme,
  reportPreview,
  selectedThemeIds,
  themes,
}: {
  activeTab: ReportMobileTab;
  allThemesSelected: boolean;
  cities: string[];
  errorMessage: string;
  loadingCities: boolean;
  municipality: string;
  onClear: () => void;
  onGenerate: () => void;
  onMunicipalityChange: (value: string) => void;
  onSelectAll: () => void;
  onTabChange: (tab: ReportMobileTab) => void;
  onToggleTheme: (themeId: string) => void;
  reportPreview: ReportPreviewDocument | null;
  selectedThemeIds: string[];
  themes: ReportTheme[];
}): ReactElement {
  return (
    <section className="w-full bg-white">
      {/* Abas só aparecem no mobile (<lg); no desktop o grid abaixo as ignora. */}
      <ReportMobileTabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] lg:px-10 lg:py-10 lg:gap-8">
        {/* Mobile: mostra só o painel da aba ativa. Desktop (lg:block): ambos visíveis. */}
        <div
          className={cn(
            "w-full pt-6 pb-6 lg:pt-0",
            activeTab === "config" ? "block" : "hidden",
            "lg:block",
          )}
        >
          <MunicipalityField
            cities={cities}
            loadingCities={loadingCities}
            onChange={onMunicipalityChange}
            value={municipality}
          />
          <ReportThemesField
            allThemesSelected={allThemesSelected}
            onClear={onClear}
            onSelectAll={onSelectAll}
            onToggleTheme={onToggleTheme}
            selectedThemeIds={selectedThemeIds}
            themes={themes}
          />
          {errorMessage && <ReportErrorMessage message={errorMessage} />}
          <ReportSubmitButton onClick={onGenerate} />
        </div>
        <div
          className={cn(
            "min-w-0",
            activeTab === "report" ? "block" : "hidden",
            "lg:block",
          )}
        >
          <ReportPreview preview={reportPreview} />
        </div>
      </div>
    </section>
  );
}

function ReportMobileTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: ReportMobileTab;
  onTabChange: (tab: ReportMobileTab) => void;
}): ReactElement {
  return (
    <div
      role="tablist"
      aria-label="Relatório"
      className="flex h-[60px] w-full items-start gap-4 border-b border-grey-400 bg-white px-4 pt-2 lg:hidden"
    >
      <ReportMobileTabButton
        active={activeTab === "config"}
        label="Configurações"
        onSelect={() => onTabChange("config")}
        tabId="report-tab-config"
      />
      <ReportMobileTabButton
        active={activeTab === "report"}
        label="Relatório"
        onSelect={() => onTabChange("report")}
        tabId="report-tab-preview"
      />
    </div>
  );
}

function ReportMobileTabButton({
  active,
  label,
  onSelect,
  tabId,
}: {
  active: boolean;
  label: string;
  onSelect: () => void;
  tabId: string;
}): ReactElement {
  return (
    <button
      aria-selected={active}
      className={cn(
        "flex h-[52px] items-center justify-center px-4 text-base font-medium leading-5 transition-colors",
        active ? "border-b-2 border-green-800 text-green-800" : "text-grey-600",
      )}
      id={tabId}
      role="tab"
      type="button"
      onClick={onSelect}
    >
      {label}
    </button>
  );
}

function ReportSectionHeader({
  subtitle,
  title,
}: {
  subtitle: string;
  title: string;
}): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-2xl font-semibold leading-9 tracking-tight text-[#292829]">
        {title}
      </h2>
      <p className="text-base font-normal leading-relaxed text-[#292829]">
        {subtitle}
      </p>
    </div>
  );
}

function MunicipalityField({
  cities,
  loadingCities,
  onChange,
  value,
}: {
  cities: string[];
  loadingCities: boolean;
  onChange: (value: string) => void;
  value: string;
}): ReactElement {
  return (
    <>
      <ReportSectionHeader
        subtitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        title="Selecione o município"
      />
      <MunicipalitySearch cities={cities} onChange={onChange} value={value} />
      {loadingCities && (
        <p className="mt-2 text-xs leading-5 text-grey-700">
          Carregando municípios...
        </p>
      )}
    </>
  );
}

function MunicipalitySearch({
  cities,
  onChange,
  value,
}: {
  cities: string[];
  onChange: (value: string) => void;
  value: string;
}): ReactElement {
  return (
    <label className="mt-4 flex h-10 w-full items-center gap-2 rounded-lg bg-[#EFEFEF] px-3">
      <span className="sr-only">Pesquise o município</span>
      <input
        className="min-w-0 flex-1 bg-transparent text-sm text-[#292929] outline-none placeholder:text-[#737373]"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Pesquise o município"
        list="report-municipalities"
        type="search"
        value={value}
      />
      <MunicipalityOptions cities={cities} />
      <Icon id="search-icon" size={12} />
    </label>
  );
}

function MunicipalityOptions({ cities }: { cities: string[] }): ReactElement {
  return (
    <datalist id="report-municipalities">
      {cities.map((city) => (
        <option key={city} value={city} />
      ))}
    </datalist>
  );
}

function ReportThemesField({
  allThemesSelected,
  onClear,
  onSelectAll,
  onToggleTheme,
  selectedThemeIds,
  themes,
}: {
  allThemesSelected: boolean;
  onClear: () => void;
  onSelectAll: () => void;
  onToggleTheme: (themeId: string) => void;
  selectedThemeIds: string[];
  themes: ReportTheme[];
}): ReactElement {
  return (
    <div className="mt-6">
      <ReportSectionHeader
        subtitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        title="Selecione os temas"
      />
      <ReportThemeActions onClear={onClear} />
      <ReportThemeList
        onToggleTheme={onToggleTheme}
        selectedThemeIds={selectedThemeIds}
        themes={themes}
      />
      <SelectAllThemesButton
        allThemesSelected={allThemesSelected}
        onClick={onSelectAll}
      />
    </div>
  );
}

function ReportThemeActions({
  onClear,
}: {
  onClear: () => void;
}): ReactElement {
  return (
    <div className="mt-4 flex items-center gap-4">
      <button
        className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-[#EFEFEF] bg-white px-4 text-sm font-medium text-[#E5333F] transition-colors hover:bg-[#FFF5F5] lg:w-full lg:flex-none lg:rounded-md"
        onClick={onClear}
        type="button"
      >
        Limpar Seleções
        <Icon id="trash" size={14} />
      </button>
    </div>
  );
}

function ReportThemeList({
  onToggleTheme,
  selectedThemeIds,
  themes,
}: {
  onToggleTheme: (themeId: string) => void;
  selectedThemeIds: string[];
  themes: ReportTheme[];
}): ReactElement {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {themes.map((theme) => {
        const iconKey = normalizeKey(theme.name);
        const iconId = MACROTHEME_ICON_BY_ID[iconKey] || "list";
        const disabled = !getAutomaticReportSlug(theme.id);

        return (
          <ThemeFilterCard
            key={theme.sys.id}
            iconId={iconId}
            color={theme.color}
            name={theme.name}
            checked={selectedThemeIds.includes(theme.id)}
            disabled={disabled}
            className="w-full"
            onCheckedChange={() => !disabled && onToggleTheme(theme.id)}
          />
        );
      })}
    </div>
  );
}

function SelectAllThemesButton({
  allThemesSelected,
  onClick,
}: {
  allThemesSelected: boolean;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      className="mt-4 flex h-10 w-full items-center justify-center rounded-md text-sm font-medium text-[#018F39] transition-colors hover:bg-[#DDEADF] disabled:opacity-50"
      disabled={allThemesSelected}
      onClick={onClick}
      type="button"
    >
      Selecionar todos
    </button>
  );
}

function ReportErrorMessage({ message }: { message: string }): ReactElement {
  return <p className="mt-4 text-sm font-medium text-red-700">{message}</p>;
}

function ReportSubmitButton({
  onClick,
}: {
  onClick: () => void;
}): ReactElement {
  return (
    <Button
      className="mt-5 h-10 w-full rounded-md bg-[#018F39] text-[#F8F7F8] hover:bg-[#017032]"
      onClick={onClick}
      type="button"
    >
      <Icon id="file-text" size={12} />
      Gerar Relatório
    </Button>
  );
}

function sortThemes(themes: ReportTheme[]): ReportTheme[] {
  return sortContentByDesiredOrder(themes, THEMES_NAVIGATION_ORDER);
}

function toggleThemeId(
  currentIds: string[],
  themeId: string,
  supportedThemeIds: string[],
): string[] {
  if (currentIds.includes(themeId)) {
    if (currentIds.length > 1) return [themeId];

    return currentIds.filter((id) => id !== themeId);
  }

  return supportedThemeIds.includes(themeId) ? [themeId] : currentIds;
}

function getSupportedThemeIds(themes: ReportTheme[]): string[] {
  return themes
    .map((theme) => theme.id)
    .filter((themeId) => Boolean(getAutomaticReportSlug(themeId)));
}

function hasSelectedAllThemes(
  selectedThemeIds: string[],
  supportedThemeIds: string[],
): boolean {
  return (
    supportedThemeIds.length > 0 &&
    supportedThemeIds.every((themeId) => selectedThemeIds.includes(themeId))
  );
}

function buildReportRequest(
  city: string,
  selectedThemeIds: string[],
): { city: string; macrotheme: AutomaticReportMacrothemeSlug } | null {
  const macrotheme = resolveSelectedMacrotheme(selectedThemeIds);
  if (!city.trim() || !macrotheme) return null;

  return { city: city.trim(), macrotheme };
}

function buildReportFileName(city: string): string {
  const safeCity = city.trim().replaceAll(/[^\p{L}\p{N}]+/gu, "-");

  return `relatorio-${safeCity.toLowerCase()}.pdf`;
}

function resolveSelectedMacrotheme(
  selectedThemeIds: string[],
): AutomaticReportMacrothemeSlug | null {
  if (selectedThemeIds.length > 1) return "todos";

  return getAutomaticReportSlug(selectedThemeIds[0] ?? "");
}

async function loadReportCities(
  setCities: (cities: string[]) => void,
  setLoading: (loading: boolean) => void,
  setErrorMessage: (message: string) => void,
): Promise<void> {
  setLoading(true);
  try {
    const response = await fetch("/api/reports/cities");
    if (!response.ok) throw new Error(`status ${response.status}`);
    const cities = (await response.json()) as string[];
    setCities(Array.isArray(cities) ? cities : []);
  } catch {
    setErrorMessage("Não foi possível carregar a lista de municípios.");
  } finally {
    setLoading(false);
  }
}
