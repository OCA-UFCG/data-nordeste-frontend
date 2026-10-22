"use client";

import { useCallback, useId, useState } from "react";
import { IdhFilterBar } from "@/components/IdhDashboard/IdhFilterBar";
import { IdhGroupView } from "@/components/IdhDashboard/IdhGroupView";
import { IdhOverview } from "@/components/IdhDashboard/IdhOverview";
import { PanelHeader } from "@/components/Panel/PanelShell";
import { PanelTabs } from "@/components/Panel/PanelTabs";
import { usePanelNavigation } from "@/components/Panel/useTerritorialNavigation";
import {
  buildIdhSearch,
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
}: {
  tab: IdhVisao;
  data: IdhPanelData;
}) => {
  if (tab === "sexo") {
    return (
      <IdhGroupView
        groups={data.sexo}
        ano={data.filters.ano}
        dimension="por sexo"
      />
    );
  }
  if (tab === "cor") {
    return (
      <IdhGroupView
        groups={data.cor}
        ano={data.filters.ano}
        dimension="por cor"
      />
    );
  }

  return <IdhOverview data={data} />;
};

export const IdhDashboard = ({ data }: { data: IdhPanelData }) => {
  const idPrefix = useId();
  const [tab, setTab] = useState<IdhVisao>(data.filters.visao);
  const { isPending, applyFilters, showVisao } = useIdhNavigation();
  const selectTab = (visao: IdhVisao) => {
    setTab(visao);
    showVisao({ ...data.filters, visao });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PanelHeader
        title="Índice de Desenvolvimento Humano (IDH)"
        subtitle={describeIdhSelection(data)}
      >
        <IdhFilterBar
          filters={data.filters}
          ufs={data.ufs}
          onChange={(next) => applyFilters({ ...next, visao: tab })}
        />
      </PanelHeader>
      <PanelTabs
        tabs={IDH_VISOES}
        activeKey={tab}
        idPrefix={idPrefix}
        onSelect={(key) => selectTab(key as IdhVisao)}
      />
      <div
        id={`${idPrefix}-panel`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${tab}`}
        aria-busy={isPending}
        className="transition-opacity aria-busy:opacity-60"
      >
        <IdhTabContent tab={tab} data={data} />
      </div>
    </div>
  );
};
