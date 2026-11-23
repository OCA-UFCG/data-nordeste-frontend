"use client";

import { useCallback, useState } from "react";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import { usePendingFilters } from "@/components/ProtoPanel/usePendingFilters";
import { useProtoRetry } from "@/components/ProtoPanel/useProtoRetry";
import { resolveIdhCardStates } from "@/features/panels/idh/idhCardState";
import {
  buildIdhSearch,
  defaultIdhFilters,
  type IdhFilters,
  type IdhPanelData,
  type IdhVisao,
} from "@/features/panels/idh/idhPanel";
import type { YearRange } from "@/features/panels/territorialFilters";

// Trocar de aba não consulta o banco de novo: só atualiza a URL.
const useIdhNavigation = (range: YearRange) => {
  const buildSearch = useCallback(
    (filters: IdhFilters) => buildIdhSearch(filters, range),
    [range],
  );
  const { isPending, pathname, applyFilters } = usePanelNavigation(buildSearch);
  const showVisao = useCallback(
    (filters: IdhFilters) =>
      window.history.replaceState(
        null,
        "",
        `${pathname}${buildSearch(filters)}`,
      ),
    [pathname, buildSearch],
  );

  return { isPending, pathname, applyFilters, showVisao };
};

// A aba é estado local (trocar de aba só usa replaceState), mas acompanha a
// `visao` do servidor quando um link muda ?visao= sem trocar de página.
// INTENTIONAL: compara com a visão anterior em vez de usar `key` na página. A
// `key` remontava o painel no primeiro filtro depois de trocar de aba e fechava
// a folha de filtros do celular (revisão da PR #397).
const useIdhTab = (serverVisao: IdhVisao) => {
  const [tab, setTab] = useState<IdhVisao>(serverVisao);
  const [lastServerVisao, setLastServerVisao] = useState(serverVisao);

  if (serverVisao !== lastServerVisao) {
    setLastServerVisao(serverVisao);
    setTab(serverVisao);
  }

  return [tab, setTab] as const;
};

// Troca de aba sem consultar o banco; `onSwitch` atualiza a URL e a rolagem.
const useIdhTabSelection = (
  serverVisao: IdhVisao,
  onSwitch: (visao: IdhVisao) => void,
) => {
  const [tab, setTab] = useIdhTab(serverVisao);
  const selectTab = (visao: IdhVisao) => {
    if (visao === tab) return;
    setTab(visao);
    onSwitch(visao);
  };

  return [tab, selectTab] as const;
};

// Ações dos cards e da barra de filtros. Filtrar leva a aba aberta para a URL:
// é ela que o servidor devolve em `data.filters.visao`.
const useIdhFilterActions = (
  selection: IdhFilters,
  tab: IdhVisao,
  range: YearRange,
  request: (filters: IdhFilters) => void,
) => {
  const changeFilters = (next: IdhFilters) => request({ ...next, visao: tab });

  return {
    changeFilters,
    reset: () => changeFilters(defaultIdhFilters(range)),
    selectUf: (uf: string) =>
      changeFilters({
        ...selection,
        uf: selection.uf === uf ? undefined : uf,
      }),
    selectYear: (ano: number) => changeFilters({ ...selection, ano }),
  };
};

// Navegação, retry, filtros pedidos e o estado de cada card; a aba fica fora.
const useIdhLoad = (data: IdhPanelData, failed: boolean) => {
  const navigation = useIdhNavigation(data.yearRange);
  const { retrying, retry } = useProtoRetry();
  const filters = usePendingFilters(
    data.filters,
    navigation.applyFilters,
    navigation.isPending,
  );
  const states = resolveIdhCardStates(
    { failed, retrying, pending: filters.pending },
    data.filters,
  );

  return { navigation, retry, filters, states };
};

/**
 * Estado do painel de IDH: aba aberta, filtros pedidos, estado de cada card e
 * as ações dos filtros. `revealPanel`: no celular, rola até o início das
 * visões ao trocar de aba.
 *
 * @example const dashboard = useIdhDashboard(panel, false, () => sticky.reveal(layoutRef.current));
 */
export const useIdhDashboard = (
  data: IdhPanelData,
  failed: boolean,
  revealPanel: () => void,
) => {
  const { navigation, retry, filters, states } = useIdhLoad(data, failed);
  const { selection } = filters;
  const [tab, selectTab] = useIdhTabSelection(data.filters.visao, (visao) => {
    navigation.showVisao({ ...selection, visao });
    revealPanel();
  });
  const actions = useIdhFilterActions(
    selection,
    tab,
    data.yearRange,
    filters.request,
  );
  const { pathname } = navigation;

  return { tab, selectTab, selection, states, retry, pathname, actions };
};

export type IdhDashboardModel = ReturnType<typeof useIdhDashboard>;
