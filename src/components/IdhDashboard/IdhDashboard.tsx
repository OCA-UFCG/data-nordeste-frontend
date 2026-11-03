"use client";

import { useCallback, useId, useState } from "react";
import { IdhGroupView } from "@/components/IdhDashboard/IdhGroupView";
import { IdhOverview } from "@/components/IdhDashboard/IdhOverview";
import { IdhSaibaMais } from "@/components/IdhDashboard/IdhSaibaMais";
import { IdhSelects } from "@/components/IdhDashboard/IdhSelects";
import { IDH_ICON, IDH_TITLE } from "@/components/IdhDashboard/idhTheme";
import { PanelFilters } from "@/components/Panel/filters/PanelFilters";
import { SelectionSummary } from "@/components/Panel/filters/SelectionSummary";
import { PanelPage } from "@/components/Panel/layout/PanelPage";
import { PanelTabs } from "@/components/Panel/layout/PanelTabs";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import {
  buildIdhSearch,
  DEFAULT_IDH_FILTERS,
  describeIdhSelection,
  IDH_VISOES,
  type IdhFilters,
  type IdhPanelData,
  type IdhVisao,
} from "@/features/panels/idh/idhPanel";

// Trocar de aba não consulta o banco de novo: só atualiza a URL.
const useIdhNavigation = () => {
  const { isPending, pathname, applyFilters } =
    usePanelNavigation(buildIdhSearch);
  const showVisao = useCallback(
    (filters: IdhFilters) =>
      window.history.replaceState(
        null,
        "",
        `${pathname}${buildIdhSearch(filters)}`,
      ),
    [pathname],
  );

  return { isPending, applyFilters, showVisao };
};

const IdhTabContent = ({
  tab,
  data,
  onSelectUf,
  onSelectYear,
}: {
  tab: IdhVisao;
  data: IdhPanelData;
  onSelectUf: (uf: string) => void;
  onSelectYear: (ano: number) => void;
}) => {
  if (tab === "geral") {
    return (
      <IdhOverview
        data={data}
        onSelectUf={onSelectUf}
        onSelectYear={onSelectYear}
      />
    );
  }

  return (
    <IdhGroupView
      groups={data[tab]}
      ano={data.filters.ano}
      dimension={tab === "sexo" ? "por sexo" : "por cor"}
      onSelectYear={onSelectYear}
    />
  );
};

export const IdhDashboard = ({
  data,
  source,
}: {
  data: IdhPanelData;
  source: string;
}) => {
  const idPrefix = useId();
  const [tab, setTab] = useState<IdhVisao>(data.filters.visao);
  const { isPending, applyFilters, showVisao } = useIdhNavigation();
  const selectTab = (visao: IdhVisao) => {
    setTab(visao);
    showVisao({ ...data.filters, visao });
  };
  const changeFilters = (next: IdhFilters) =>
    applyFilters({ ...next, visao: tab });
  const summary = describeIdhSelection(data);

  return (
    <PanelPage
      title={IDH_TITLE}
      icon={IDH_ICON}
      tone="orange"
      source={source}
      info={<IdhSaibaMais visao={tab} />}
      fullMobile
      top={
        <PanelTabs
          tabs={IDH_VISOES}
          activeKey={tab}
          idPrefix={idPrefix}
          onSelect={(key) => selectTab(key as IdhVisao)}
        />
      }
    >
      <PanelFilters
        summary={summary}
        onClear={() => changeFilters(DEFAULT_IDH_FILTERS)}
        isPending={isPending}
        sticky
      >
        <IdhSelects
          filters={data.filters}
          ufs={data.ufs}
          onChange={changeFilters}
        />
      </PanelFilters>
      <SelectionSummary summary={summary} isPending={isPending} />
      <div
        id={`${idPrefix}-panel`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${tab}`}
        aria-busy={isPending}
        className="transition-opacity duration-300 ease-out aria-busy:opacity-75 aria-busy:delay-150 motion-reduce:transition-none"
      >
        <IdhTabContent
          tab={tab}
          data={data}
          onSelectUf={(uf) => changeFilters({ ...data.filters, uf })}
          onSelectYear={(ano) => changeFilters({ ...data.filters, ano })}
        />
      </div>
    </PanelPage>
  );
};
