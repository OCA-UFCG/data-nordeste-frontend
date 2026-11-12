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
import { ReportAreaField } from "@/components/ReportBuilder/ReportAreaField";
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
  getAutomaticReportSlug,
  joinReportSlugs,
  type AutomaticReportMacrothemeSlug,
} from "@/features/reports/automaticReport";
import { requestReportPreview } from "@/features/reports/requestReportPreview";
import { ReportBusyError } from "@/features/reports/reportBusyError";
import { resolveMunicipality } from "@/features/reports/municipalitySearch";
import {
  EMPTY_REPORT_PLACES,
  parseReportPlaces,
  type ReportPlaces,
} from "@/features/reports/reportPlaces";
import {
  findReportScope,
  getScopeAreaName,
  isThemeAvailableInScope,
  selectReportScopePlaces,
  type ReportScopeId,
} from "@/features/reports/reportScopes";
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
  const [scopeId, setScopeId] = useState<ReportScopeId | null>(null);
  const [municipality, setMunicipality] = useState("");
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [places, setPlaces] = useState<ReportPlaces>(EMPTY_REPORT_PLACES);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportPreview, setReportPreview] =
    useState<ReportPreviewDocument | null>(null);

  const [activeTab, setActiveTab] = useState<ReportMobileTab>("config");
  const sortedThemes = useMemo(
    () => sortThemes(getSupportedThemes(themes, scopeId)),
    [themes, scopeId],
  );
  const supportedThemeIds = useMemo(
    () => getSupportedThemeIds(sortedThemes),
    [sortedThemes],
  );
  const allThemesSelected = hasSelectedAllThemes(
    selectedThemeIds,
    supportedThemeIds,
  );

  const scopedPlaces = useMemo(
    () => selectReportScopePlaces(scopeId, places),
    [scopeId, places],
  );

  // INTENTIONAL: Resolve the typed municipality against the known places
  // (states and cities) using accent- and case-insensitive normalization, so users can type
  // "campina grande" or "sao luis" and still select "Campina Grande" / "São Luís".
  // Only the places of the chosen "Recorte" count, so a state typed while
  // "Município" is selected does not complete the step.
  const resolvedMunicipality = resolveMunicipality(municipality, scopedPlaces);

  useEffect(() => {
    void loadReportPlaces(setPlaces, setLoadingPlaces, setErrorMessage);
  }, []);

  // A territory from the previous "Recorte" (e.g. a municipality after
  // switching to "Estado") would never resolve, so it is cleared. An area
  // "Recorte" (Caatinga, Nordeste…) is itself the territory, so it fills it in.
  const changeScope = (nextScopeId: ReportScopeId): void => {
    setScopeId(nextScopeId);
    setMunicipality(getScopeAreaName(findReportScope(nextScopeId)) ?? "");

    // A theme the new "Recorte" has no data for (e.g. Desenvolvimento Social
    // in Caatinga) leaves the selection with its card.
    setSelectedThemeIds((currentIds) =>
      currentIds.filter((themeId) =>
        isThemeAvailableInScope(themeId, nextScopeId),
      ),
    );
  };

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
    const request = buildReportRequest(resolvedMunicipality, selectedThemeIds);
    if (!request) {
      setErrorMessage(
        "Selecione o recorte, o território e ao menos um macrotema disponível.",
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
    } catch (error) {
      if (error instanceof ReportBusyError) {
        setErrorMessage(
          "O gerador está ocupado no momento. Tente novamente em instantes.",
        );

        return;
      }
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
      areaField={
        <ReportAreaField
          availableAreas={places.areas}
          introText={municipalityText}
          loadingPlaces={loadingPlaces}
          onScopeChange={changeScope}
          onTerritoryChange={setMunicipality}
          scopeId={scopeId}
          scopedPlaces={scopedPlaces}
          territory={municipality}
        />
      }
      areaSelected={resolvedMunicipality !== null}
      errorMessage={errorMessage}
      generatingReport={generatingReport}
      onClear={clearSelectedThemes}
      onGenerate={generateReport}
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
  areaField,
  areaSelected,
  errorMessage,
  generatingReport,
  onClear,
  onGenerate,
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
  areaField: ReactElement;
  areaSelected: boolean;
  errorMessage: string;
  generatingReport: boolean;
  onClear: () => void;
  onGenerate: () => void;
  onSelectAll: () => void;
  onTabChange: (tab: ReportMobileTab) => void;
  onToggleTheme: (themeId: string) => void;
  reportPreview: ReportPreviewDocument | null;
  selectedThemeIds: string[];
  themes: ReportTheme[];
  themeText?: ContentfulRichTextField;
}): ReactElement {
  const [openStep, setOpenStep] = useState<ReportStepId | "">("area");
  const themesSelected = selectedThemeIds.length > 0;
  const formCompleted = areaSelected && themesSelected;

  useEffect(() => {
    if (!areaSelected) return;
    setOpenStep("themes");
  }, [areaSelected]);

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
                completed={areaSelected}
                number={1}
                stepId="area"
                title="Área de Interesse"
              >
                {areaField}
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
      <SelectAllThemesButton
        allThemesSelected={allThemesSelected}
        onClick={onSelectAll}
      />
      <ReportThemeList
        onToggleTheme={onToggleTheme}
        selectedThemeIds={selectedThemeIds}
        themes={themes}
      />
      <ReportThemeActions onClear={onClear} />
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
        className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-[#EFEFEF] bg-white px-4 text-sm font-medium text-red-800 transition-colors hover:bg-[#FFF5F5] lg:w-full lg:flex-none lg:rounded-md"
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
            href={`/macrothemes/${theme.id.replace(/_/g, "-")}`}
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
      className="mt-4 flex h-10 w-full items-center justify-center rounded-md text-sm font-medium text-green-800 transition-colors hover:bg-[#DDEADF] disabled:opacity-50"
      disabled={allThemesSelected}
      onClick={onClick}
      type="button"
    >
      Selecionar todos
    </button>
  );
}

function ReportErrorMessage({ message }: { message: string }): ReactElement {
  return <p className="mt-4 text-sm font-medium text-red-800">{message}</p>;
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
      className="mt-5 h-10 w-full rounded-md bg-green-800 text-[#F8F7F8] hover:bg-[#017032] disabled:bg-[#BEBBBD]"
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

function getSupportedThemes(
  themes: ReportTheme[],
  scopeId: ReportScopeId | null,
): ReportTheme[] {
  return themes.filter((theme) => isThemeAvailableInScope(theme.id, scopeId));
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
  city: string | null,
  selectedThemeIds: string[],
): { city: string; macrotheme: string } | null {
  const macrotheme = resolveSelectedMacrotheme(selectedThemeIds);
  if (!city || !macrotheme) return null;

  return { city, macrotheme };
}

function resolveSelectedMacrotheme(selectedThemeIds: string[]): string | null {
  const slugs = selectedThemeIds
    .map((themeId) => getAutomaticReportSlug(themeId))
    .filter((slug): slug is AutomaticReportMacrothemeSlug => Boolean(slug));
  if (slugs.length === 0) return null;

  return joinReportSlugs(slugs);
}

async function loadReportPlaces(
  setPlaces: (places: ReportPlaces) => void,
  setLoading: (loading: boolean) => void,
  setErrorMessage: (message: string) => void,
): Promise<void> {
  setLoading(true);
  try {
    const response = await fetch("/api/reports/cities");
    if (!response.ok) throw new Error(`status ${response.status}`);
    setPlaces(parseReportPlaces(await response.json()));
  } catch {
    setErrorMessage(
      "Não foi possível carregar a lista de municípios e estados.",
    );
  } finally {
    setLoading(false);
  }
}
