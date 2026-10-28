"use client";

import { useCallback, useId, useState } from "react";
import { FneOverview } from "@/components/FneDashboard/FneOverview";
import { FneSelects } from "@/components/FneDashboard/FneSelects";
import { FneIntro, WhatIsFne } from "@/components/FneDashboard/FneTexts";
import { FNE_ICON, FNE_TITLE } from "@/components/FneDashboard/fneTheme";
import { PanelFilters } from "@/components/Panel/PanelFilters";
import { PanelPage } from "@/components/Panel/PanelPage";
import { PanelTabs } from "@/components/Panel/PanelTabs";
import { usePanelNavigation } from "@/components/Panel/useTerritorialNavigation";
import {
  buildFneSearch,
  DEFAULT_FNE_FILTERS,
  FNE_VISOES,
  type FneFilters,
  type FneVisao,
} from "@/features/panels/fne/fneFilters";
import type { FnePanelData } from "@/features/panels/fne/fnePanel";
import { describeFneSelection } from "@/features/panels/fne/fneSelection";
import { toggleValue } from "@/features/panels/filterOptions";

// Trocar de aba não consulta o banco de novo: os dois indicadores já vieram.
const useFneNavigation = () => {
  const { isPending, pathname, applyFilters } =
    usePanelNavigation(buildFneSearch);
  const showVisao = useCallback(
    (filters: FneFilters) =>
      window.history.replaceState(
        null,
        "",
        `${pathname}${buildFneSearch(filters)}`,
      ),
    [pathname],
  );

  return { isPending, applyFilters, showVisao };
};

// A aba segue o `visao` do servidor quando ele muda (link, voltar, filtro
// aplicado), sem remontar o painel e perder o estado da tela.
const useVisao = (serverVisao: FneVisao) => {
  const [visao, setVisao] = useState(serverVisao);
  const [lastServerVisao, setLastServerVisao] = useState(serverVisao);

  if (serverVisao !== lastServerVisao) {
    setLastServerVisao(serverVisao);
    setVisao(serverVisao);
  }

  return [visao, setVisao] as const;
};

export const FneDashboard = ({
  data,
  source,
}: {
  data: FnePanelData;
  source: string;
}) => {
  const idPrefix = useId();
  const [visao, setVisao] = useVisao(data.filters.visao);
  const { isPending, applyFilters, showVisao } = useFneNavigation();
  const selectVisao = (next: FneVisao) => {
    setVisao(next);
    showVisao({ ...data.filters, visao: next });
  };
  const changeFilters = (next: FneFilters) => applyFilters({ ...next, visao });

  return (
    <PanelPage
      title={FNE_TITLE}
      icon={FNE_ICON}
      tone="green"
      source={source}
      summarized={false}
      top={
        <PanelTabs
          tabs={FNE_VISOES}
          activeKey={visao}
          idPrefix={idPrefix}
          onSelect={(key) => selectVisao(key as FneVisao)}
        />
      }
    >
      <FneIntro />
      <PanelFilters
        summary={describeFneSelection(data)}
        onClear={() => changeFilters(DEFAULT_FNE_FILTERS)}
      >
        <FneSelects
          filters={data.filters}
          ufs={data.ufs}
          municipios={data.municipios}
          onChange={changeFilters}
        />
      </PanelFilters>
      <div
        id={`${idPrefix}-panel`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${visao}`}
        aria-busy={isPending}
        className="transition-opacity aria-busy:opacity-60"
      >
        <FneOverview
          data={data}
          visao={visao}
          onSelectAno={(ano) => changeFilters({ ...data.filters, ano })}
          onSelectMunicipality={(cdMun) =>
            changeFilters({
              ...data.filters,
              muns: toggleValue(data.filters.muns, cdMun),
            })
          }
        />
      </div>
      <WhatIsFne />
    </PanelPage>
  );
};
