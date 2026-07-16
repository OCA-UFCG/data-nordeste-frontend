"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon/Icon";
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

type ReportBuilderProps = {
  themes: ReportTheme[];
};

type ReportThemeRowProps = {
  theme: ReportTheme;
  checked: boolean;
  disabled: boolean;
  onToggle: (themeId: string) => void;
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
      allThemesSelected={allThemesSelected}
      cities={cities}
      errorMessage={errorMessage}
      loadingCities={loadingCities}
      municipality={municipality}
      onClear={clearSelectedThemes}
      onGenerate={generateReport}
      onMunicipalityChange={setMunicipality}
      onSelectAll={selectEveryTheme}
      onToggleTheme={toggleTheme}
      reportPreview={reportPreview}
      selectedThemeIds={selectedThemeIds}
      themes={sortedThemes}
    />
  );
}

function ReportBuilderLayout({
  allThemesSelected,
  cities,
  errorMessage,
  loadingCities,
  municipality,
  onClear,
  onGenerate,
  onMunicipalityChange,
  onSelectAll,
  onToggleTheme,
  reportPreview,
  selectedThemeIds,
  themes,
}: {
  allThemesSelected: boolean;
  cities: string[];
  errorMessage: string;
  loadingCities: boolean;
  municipality: string;
  onClear: () => void;
  onGenerate: () => void;
  onMunicipalityChange: (value: string) => void;
  onSelectAll: () => void;
  onToggleTheme: (themeId: string) => void;
  reportPreview: ReportPreviewDocument | null;
  selectedThemeIds: string[];
  themes: ReportTheme[];
}): ReactElement {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(360px,462px)_minmax(0,1fr)] lg:px-20 lg:py-10">
        <div className="w-full">
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
        <ReportPreview preview={reportPreview} />
      </div>
    </section>
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
      <ReportThemeActions
        allThemesSelected={allThemesSelected}
        onClear={onClear}
        onSelectAll={onSelectAll}
      />
      <ReportThemeList
        onSelectAll={onSelectAll}
        onToggleTheme={onToggleTheme}
        selectedThemeIds={selectedThemeIds}
        themes={themes}
      />
    </div>
  );
}

function ReportThemeActions({
  allThemesSelected,
  onClear,
  onSelectAll,
}: {
  allThemesSelected: boolean;
  onClear: () => void;
  onSelectAll: () => void;
}): ReactElement {
  return (
    <div className="mt-4 flex items-center gap-4">
      <button
        className="flex h-10 w-[223px] items-center justify-center gap-2.5 rounded-md border border-[#EFEFEF] bg-white px-4 text-sm font-medium text-[#E5333F] transition-colors hover:bg-[#FFF5F5]"
        onClick={onClear}
        type="button"
      >
        Limpar seleções
        <Icon id="trash" size={14} />
      </button>
      <button
        className="flex h-10 w-[223px] items-center justify-center gap-2.5 rounded-md bg-white px-4 text-sm font-medium text-[#018F39] transition-colors hover:bg-[#F0FFF4]"
        disabled={allThemesSelected}
        onClick={onSelectAll}
        type="button"
      >
        Selecionar todos
      </button>
    </div>
  );
}

function ReportThemeList({
  onSelectAll,
  onToggleTheme,
  selectedThemeIds,
  themes,
}: {
  onSelectAll: () => void;
  onToggleTheme: (themeId: string) => void;
  selectedThemeIds: string[];
  themes: ReportTheme[];
}): ReactElement {
  return (
    <>
      <div className="mt-4 flex flex-col gap-2">
        {themes.map((theme) => (
          <ReportThemeRow
            checked={selectedThemeIds.includes(theme.id)}
            disabled={!getAutomaticReportSlug(theme.id)}
            key={theme.sys.id}
            onToggle={onToggleTheme}
            theme={theme}
          />
        ))}
      </div>
      <SelectAllThemesButton onClick={onSelectAll} />
    </>
  );
}

function SelectAllThemesButton({
  onClick,
}: {
  onClick: () => void;
}): ReactElement {
  return (
    <button
      className="mx-auto mt-5 flex h-9 items-center justify-center rounded-md px-4 text-xs font-medium text-green-800 transition-colors hover:bg-green-neutro"
      onClick={onClick}
      type="button"
    >
      Selecionar todos
    </button>
  );
}

function ReportThemeRow({
  checked,
  disabled,
  onToggle,
  theme,
}: ReportThemeRowProps): ReactElement {
  const iconKey = normalizeKey(theme.name);
  const iconId = MACROTHEME_ICON_BY_ID[iconKey] || "list";

  return (
    <div
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-lg bg-[#F8F7F8] px-2 text-left transition-colors hover:bg-[#F0EFEE]",
        checked && "bg-[#E8F5EC]",
        disabled && "cursor-not-allowed opacity-50 hover:bg-[#F8F7F8]",
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onToggle(theme.id)}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onToggle(theme.id);
        }
      }}
      title={
        disabled
          ? "Macrotema ainda indisponível no relatório automático"
          : undefined
      }
    >
      <Checkbox
        checked={checked}
        className="h-4 w-4 border-[#018F39] data-[state=checked]:bg-[#018F39]"
        disabled={disabled}
        onCheckedChange={() => onToggle(theme.id)}
        onClick={(event) => event.stopPropagation()}
      />
      <div className="flex h-6 w-6 items-center justify-center rounded-md">
        <Icon id={iconId} size={16} style={{ color: theme.color }} />
      </div>
      <span className="flex-1 text-sm font-normal leading-5 text-[#292829]">
        {theme.name}
      </span>
      <Icon id="expand-black" size={8} className="text-[#292829]" />
    </div>
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
