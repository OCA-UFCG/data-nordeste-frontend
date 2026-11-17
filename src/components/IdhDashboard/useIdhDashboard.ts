"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import { resolveIdhCardStates } from "@/features/panels/idh/idhCardState";
import {
  buildIdhSearch,
  DEFAULT_IDH_FILTERS,
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

  return { isPending, pathname, applyFilters, showVisao };
};

// "Tentar de novo" dos cards: o server component consulta o banco outra vez.
const useRetry = () => {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  return { retrying, retry: () => startRetry(() => router.refresh()) };
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

// Guarda os filtros pedidos enquanto o servidor não responde. A seleção
// (estado destacado, ano, selects) já mostra o pedido, e cada card sabe se o
// dado dele vai mudar. Filtrar parte da seleção, não de `data.filters`: assim
// escolher o ano logo depois do estado não descarta o estado ainda pendente.
const usePendingFilters = (
  data: IdhPanelData,
  applyFilters: (filters: IdhFilters) => void,
  isPending: boolean,
) => {
  const [requested, setRequested] = useState<IdhFilters | null>(null);
  const pending = isPending ? requested : null;
  const request = (next: IdhFilters) => {
    setRequested(next);
    applyFilters(next);
  };

  return { pending, selection: pending ?? data.filters, request };
};

// Ações dos cards e da barra de filtros. Filtrar leva a aba aberta para a URL:
// é ela que o servidor devolve em `data.filters.visao`.
const useIdhFilterActions = (
  selection: IdhFilters,
  tab: IdhVisao,
  request: (filters: IdhFilters) => void,
) => {
  const changeFilters = (next: IdhFilters) => request({ ...next, visao: tab });

  return {
    changeFilters,
    reset: () => changeFilters(DEFAULT_IDH_FILTERS),
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
  const navigation = useIdhNavigation();
  const { retrying, retry } = useRetry();
  const filters = usePendingFilters(
    data,
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
  const actions = useIdhFilterActions(selection, tab, filters.request);
  const { pathname } = navigation;

  return { tab, selectTab, selection, states, retry, pathname, actions };
};

export type IdhDashboardModel = ReturnType<typeof useIdhDashboard>;
