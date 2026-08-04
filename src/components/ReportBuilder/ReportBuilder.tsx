"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon/Icon";
import ThemeFilterCard from "@/components/ExploreFilters/ThemeFilterCard";
import {
  ReportPreview,
  type ReportPreviewDocument,
} from "@/components/ReportBuilder/ReportPreview";
import {
  ReportStep,
  ReportSteps,
  type ReportStepId,
} from "@/components/ReportBuilder/ReportSteps";
import { cn } from "@/lib/utils";
import {
  MACROTHEME_ICON_BY_ID,
  THEMES_NAVIGATION_ORDER,
} from "@/features/macrothemes/constants";
import {
  buildReportProxyUrl,
  getAutomaticReportSlug,
  joinReportSlugs,
  type AutomaticReportMacrothemeSlug,
} from "@/features/reports/automaticReport";
import type { ContentfulRichTextField, MacroTheme } from "@/utils/interfaces";
import { normalizeKey, sortContentByDesiredOrder } from "@/utils/functions";

type ReportTheme = Pick<MacroTheme, "id" | "name" | "color" | "sys">;
type ReportMobileTab = "config" | "report";

type ReportBuilderProps = {
  themes: ReportTheme[];
  municipalityText?: ContentfulRichTextField;
  themeText?: ContentfulRichTextField;
};

/** Renders the automatic report form. Example: `<ReportBuilder themes={themes} />`. */
export function ReportBuilder({
  themes,
  municipalityText,
  themeText,
}: ReportBuilderProps): ReactElement {
  const [municipality, setMunicipality] = useState("");
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingCities, setLoadingCities] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
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

  const generateReport = async (): Promise<void> => {
    const request = buildReportRequest(municipality, selectedThemeIds);
    if (!request) {
      setErrorMessage(
        "Selecione um município e ao menos um macrotema disponível.",
      );

      return;
    }

    setErrorMessage("");
    setGeneratingReport(true);
    setReportPreview(null);
    try {
      const preview = await requestReportPreview(request);
      setReportPreview(preview);
      setActiveTab("report");
    } catch {
      setErrorMessage(
        "O relatório demorou mais que o esperado. Tente novamente.",
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <ReportBuilderLayout
      activeTab={activeTab}
      allThemesSelected={allThemesSelected}
      cities={cities}
      errorMessage={errorMessage}
      generatingReport={generatingReport}
      loadingCities={loadingCities}
      municipality={municipality}
      municipalityText={municipalityText}
      onClear={clearSelectedThemes}
      onGenerate={generateReport}
      onMunicipalityChange={setMunicipality}
      onSelectAll={selectEveryTheme}
      onTabChange={setActiveTab}
      onToggleTheme={toggleTheme}
      reportPreview={reportPreview}
      selectedThemeIds={selectedThemeIds}
      themes={sortedThemes}
      themeText={themeText}
    />
  );
}

function ReportBuilderLayout({
  activeTab,
  allThemesSelected,
  cities,
  errorMessage,
  generatingReport,
  loadingCities,
  municipality,
  municipalityText,
  onClear,
  onGenerate,
  onMunicipalityChange,
  onSelectAll,
  onTabChange,
  onToggleTheme,
  reportPreview,
  selectedThemeIds,
  themes,
  themeText,
}: {
  activeTab: ReportMobileTab;
  allThemesSelected: boolean;
  cities: string[];
  errorMessage: string;
  generatingReport: boolean;
  loadingCities: boolean;
  municipality: string;
  municipalityText?: ContentfulRichTextField;
  onClear: () => void;
  onGenerate: () => void;
  onMunicipalityChange: (value: string) => void;
  onSelectAll: () => void;
  onTabChange: (tab: ReportMobileTab) => void;
  onToggleTheme: (themeId: string) => void;
  reportPreview: ReportPreviewDocument | null;
  selectedThemeIds: string[];
  themes: ReportTheme[];
  themeText?: ContentfulRichTextField;
}): ReactElement {
  const [openStep, setOpenStep] = useState<ReportStepId | "">("municipality");
  const municipalitySelected = cities.includes(municipality.trim());
  const themesSelected = selectedThemeIds.length > 0;
  const formCompleted = municipalitySelected && themesSelected;

  useEffect(() => {
    if (!municipalitySelected) return;
    setOpenStep("themes");
  }, [municipalitySelected]);

  return (
    <section className="w-full bg-white">
      {/* Abas só aparecem no mobile (<lg); no desktop o grid abaixo as ignora. */}
      <ReportMobileTabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 lg:py-10">
        <div className="lg:grid lg:min-h-[900px] lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-8">
          <div
            className={cn(
              "w-full pt-6 pb-6 lg:pt-0",
              activeTab === "config" ? "block" : "hidden",
              "lg:block",
            )}
          >
            <ReportSteps onStepChange={setOpenStep} openStep={openStep}>
              <ReportStep
                completed={municipalitySelected}
                number={1}
                stepId="municipality"
                title="Selecione o município"
              >
                <MunicipalityField
                  cities={cities}
                  loadingCities={loadingCities}
                  municipalityText={municipalityText}
                  onChange={onMunicipalityChange}
                  value={municipality}
                />
              </ReportStep>
              <ReportStep
                completed={themesSelected}
                number={2}
                stepId="themes"
                title="Selecione os temas"
              >
                <ReportThemesField
                  allThemesSelected={allThemesSelected}
                  onClear={onClear}
                  onSelectAll={onSelectAll}
                  onToggleTheme={onToggleTheme}
                  selectedThemeIds={selectedThemeIds}
                  themeText={themeText}
                  themes={themes}
                />
              </ReportStep>
            </ReportSteps>
            {errorMessage && <ReportErrorMessage message={errorMessage} />}
            <ReportSubmitButton
              disabled={!formCompleted}
              generating={generatingReport}
              onClick={onGenerate}
            />
          </div>
          <div
            className={cn(
              activeTab === "report" ? "block" : "hidden",
              "lg:relative lg:block lg:h-full lg:min-h-0",
            )}
          >
            <ReportPreview loading={generatingReport} preview={reportPreview} />
          </div>
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

function MunicipalityField({
  cities,
  loadingCities,
  onChange,
  value,
  municipalityText,
}: {
  cities: string[];
  loadingCities: boolean;
  onChange: (value: string) => void;
  value: string;
  municipalityText?: ContentfulRichTextField;
}): ReactElement {
  return (
    <>
      <div className="text-base leading-relaxed text-[#292829]">
        {municipalityText
          ? documentToReactComponents(municipalityText.json)
          : "Selecione o município para gerar o relatório."}
      </div>
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
  themeText,
}: {
  allThemesSelected: boolean;
  onClear: () => void;
  onSelectAll: () => void;
  onToggleTheme: (themeId: string) => void;
  selectedThemeIds: string[];
  themes: ReportTheme[];
  themeText?: ContentfulRichTextField;
}): ReactElement {
  return (
    <div>
      <div className="text-base leading-relaxed text-[#292829]">
        {themeText
          ? documentToReactComponents(themeText.json)
          : "Escolha um ou mais macrotemas para compor o relatório."}
      </div>
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
        Limpar seleções
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
  disabled,
  generating,
  onClick,
}: {
  disabled: boolean;
  generating: boolean;
  onClick: () => void;
}): ReactElement {
  return (
    <Button
      className="mt-5 h-10 w-full rounded-md bg-[#018F39] text-[#F8F7F8] hover:bg-[#017032] disabled:bg-[#BEBBBD]"
      disabled={disabled || generating}
      onClick={onClick}
      type="button"
    >
      <Icon id="file-text" size={12} />
      {generating ? "Gerando relatório..." : "Gerar relatório"}
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
  if (!supportedThemeIds.includes(themeId)) return currentIds;
  if (currentIds.includes(themeId)) {
    return currentIds.filter((id) => id !== themeId);
  }

  return [...currentIds, themeId];
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
): { city: string; macrotheme: string } | null {
  const macrotheme = resolveSelectedMacrotheme(selectedThemeIds);
  if (!city.trim() || !macrotheme) return null;

  return { city: city.trim(), macrotheme };
}

function resolveSelectedMacrotheme(selectedThemeIds: string[]): string | null {
  const slugs = selectedThemeIds
    .map((themeId) => getAutomaticReportSlug(themeId))
    .filter((slug): slug is AutomaticReportMacrothemeSlug => Boolean(slug));
  if (slugs.length === 0) return null;

  return joinReportSlugs(slugs);
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

const REPORT_STATUS_INTERVAL_MS = 2000;
const REPORT_STATUS_MAX_ATTEMPTS = 60;

async function requestReportPreview(request: {
  city: string;
  macrotheme: string;
}): Promise<ReportPreviewDocument> {
  const generationUrl = buildReportProxyUrl(request);
  const startResponse = await fetch(generationUrl, { method: "POST" });
  if (!startResponse.ok) throw new Error(`status ${startResponse.status}`);

  for (let attempt = 0; attempt < REPORT_STATUS_MAX_ATTEMPTS; attempt++) {
    const preview = await fetchReadyReport(generationUrl);
    if (preview) return preview;
    await waitForReportStatus();
  }

  throw new Error(
    `Report for city "${request.city}" was not ready after ${REPORT_STATUS_MAX_ATTEMPTS} attempts; expected a PDF URL.`,
  );
}

async function fetchReadyReport(
  generationUrl: string,
): Promise<ReportPreviewDocument | null> {
  const response = await fetch(generationUrl, { cache: "no-store" });
  if (response.status === 202) return null;
  if (!response.ok) throw new Error(`status ${response.status}`);

  const result = (await response.json()) as ReportPreviewDocument & {
    status: "ready";
  };

  return { fileName: result.fileName, url: result.url };
}

function waitForReportStatus(): Promise<void> {
  return new Promise((resolve) =>
    window.setTimeout(resolve, REPORT_STATUS_INTERVAL_MS),
  );
}
