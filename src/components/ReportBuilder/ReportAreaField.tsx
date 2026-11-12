"use client";

import type { ReactElement } from "react";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { MunicipalitySearch } from "@/components/ReportBuilder/MunicipalitySearch";
import { ReportScopeSelect } from "@/components/ReportBuilder/ReportScopeSelect";
import type { ReportPlaces } from "@/features/reports/reportPlaces";
import {
  findReportScope,
  type ReportScopeId,
} from "@/features/reports/reportScopes";
import type { ContentfulRichTextField } from "@/utils/interfaces";

type ReportAreaFieldProps = {
  availableAreas: string[];
  introText?: ContentfulRichTextField;
  loadingPlaces: boolean;
  onScopeChange: (scopeId: ReportScopeId) => void;
  onTerritoryChange: (value: string) => void;
  scopeId: ReportScopeId | null;
  scopedPlaces: ReportPlaces;
  territory: string;
};

/**
 * Step 1 of the report ("Área de Interesse"): pick a "Recorte", then search the
 * territory inside it. The search only appears for a search scope (Município,
 * Estado); an area scope (Caatinga, Nordeste…) is already the territory.
 * Example: `<ReportAreaField scopeId="estado" scopedPlaces={places} … />`.
 */
export function ReportAreaField({
  availableAreas,
  introText,
  loadingPlaces,
  onScopeChange,
  onTerritoryChange,
  scopeId,
  scopedPlaces,
  territory,
}: ReportAreaFieldProps): ReactElement {
  const scope = findReportScope(scopeId);

  return (
    <>
      <div className="text-base leading-relaxed text-[#292829]">
        {introText
          ? documentToReactComponents(introText.json)
          : "Escolha o recorte e o território que serão analisados no relatório."}
      </div>
      <p className="mt-6 mb-2 text-base font-semibold text-[#292829]">
        Recorte
      </p>
      <ReportScopeSelect
        availableAreas={availableAreas}
        onChange={onScopeChange}
        value={scopeId}
      />
      {scope && "searchPlaceholder" in scope && (
        <MunicipalitySearch
          onChange={onTerritoryChange}
          places={scopedPlaces}
          placeholder={scope.searchPlaceholder}
          value={territory}
        />
      )}
      {scope && loadingPlaces && (
        <p className="mt-2 text-xs leading-5 text-grey-700">
          Carregando territórios...
        </p>
      )}
    </>
  );
}
