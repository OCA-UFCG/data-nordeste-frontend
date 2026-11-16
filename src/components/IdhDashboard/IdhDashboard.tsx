"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  IdhCardMenuContext,
  type IdhCardMenuContextValue,
} from "@/components/IdhDashboard/IdhCardMenu";
import { IdhFilterBar } from "@/components/IdhDashboard/IdhFilterBar";
import { IdhGroupView } from "@/components/IdhDashboard/IdhGroupView";
import { IdhNextViewButton } from "@/components/IdhDashboard/IdhNextViewButton";
import { IdhOverview } from "@/components/IdhDashboard/IdhOverview";
import { IdhViewBar, IdhViewRail } from "@/components/IdhDashboard/IdhViewTabs";
import { BUTTON, IDH_TEXT } from "@/components/IdhDashboard/idhStyles";
import { useIdhSticky } from "@/components/IdhDashboard/useIdhSticky";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import {
  buildIdhSearch,
  DEFAULT_IDH_FILTERS,
  describeIdhShareChips,
  IDH_VISOES,
  type IdhFilters,
  type IdhPanelData,
  type IdhVisao,
} from "@/features/panels/idh/idhPanel";
import {
  type IdhCardStates,
  resolveIdhCardStates,
} from "@/features/panels/idh/idhCardState";
import { cn } from "@/lib/utils";

// Fonte do painel no protótipo, abaixo dos cards.
const PANEL_SOURCE =
  "Fonte dos dados: Pesquisa Nacional por Amostra de Domicílios Contínua (PNAD/IBGE) · Data Nordeste";

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

// O link de compartilhar leva a aba aberta, não a da carga da página: trocar de
// aba só muda a URL com replaceState, sem novos `data.filters`.
const useCardMenuValue = (
  data: IdhPanelData,
  tab: IdhVisao,
  pathname: string,
  catalogHref: string | null,
): IdhCardMenuContextValue =>
  useMemo(
    () => ({
      share: {
        path: `${pathname}${buildIdhSearch({ ...data.filters, visao: tab })}`,
        chips: describeIdhShareChips(data, tab),
      },
      catalogHref,
    }),
    [data, tab, pathname, catalogHref],
  );

type ViewProps = {
  tab: IdhVisao;
  data: IdhPanelData;
  selection: IdhFilters;
  states: IdhCardStates;
  onRetry: () => void;
  onReset: () => void;
  onSelectUf: (uf: string) => void;
  onSelectYear: (ano: number) => void;
};

const IdhView = ({ tab, onReset, ...props }: ViewProps) =>
  tab === "geral" ? (
    <IdhOverview {...props} />
  ) : (
    <IdhGroupView
      visao={tab}
      data={props.data}
      state={props.states.groups}
      onRetry={props.onRetry}
      onReset={onReset}
    />
  );

const isDefaultFilters = ({ filters }: IdhPanelData) =>
  filters.ano === DEFAULT_IDH_FILTERS.ano && !filters.uf;

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

// `revealPanel`: no celular, rola até o início das visões ao trocar de aba.
const useIdhDashboard = (
  data: IdhPanelData,
  failed: boolean,
  revealPanel: () => void,
) => {
  const [tab, setTab] = useIdhTab(data.filters.visao);
  const navigation = useIdhNavigation();
  const { retrying, retry } = useRetry();
  const { pending, selection, request } = usePendingFilters(
    data,
    navigation.applyFilters,
    navigation.isPending,
  );
  const selectTab = (visao: IdhVisao) => {
    if (visao === tab) return;
    setTab(visao);
    navigation.showVisao({ ...selection, visao });
    revealPanel();
  };
  const states = resolveIdhCardStates(
    { failed, retrying, pending },
    data.filters,
  );
  const actions = useIdhFilterActions(selection, tab, request);

  return {
    tab,
    selectTab,
    selection,
    states,
    retry,
    pathname: navigation.pathname,
    actions,
  };
};

const useIdhTabIds = () => {
  const idPrefix = useId();

  return {
    rail: `${idPrefix}-rail`,
    bar: `${idPrefix}-tab`,
    panel: `${idPrefix}-panel`,
  };
};

// Fonte, link do catálogo e, na visão geral, o convite para a próxima visão.
const IdhPanelFooter = ({
  tab,
  catalogHref,
  nextViewTabIds,
  onSelectTab,
}: {
  tab: IdhVisao;
  catalogHref: string | null;
  nextViewTabIds: string[];
  onSelectTab: (visao: IdhVisao) => void;
}) => (
  <>
    <p className="mt-4 text-xs leading-4 text-grey-1100">{PANEL_SOURCE}</p>
    <Link
      href={catalogHref ?? "/catalog"}
      className={cn(BUTTON, "mt-4 flex w-full")}
    >
      Acessar o catálogo de dados
    </Link>
    {tab === "geral" ? (
      <IdhNextViewButton
        visao="sexo"
        tabIds={nextViewTabIds}
        onSelect={onSelectTab}
      />
    ) : null}
  </>
);

/**
 * Painel de IDH no formato do protótipo: barra de abas (celular e tablet),
 * barra de filtros, coluna lateral das visões e o conteúdo da visão. `failed`:
 * a consulta falhou e os cards mostram o erro com "Tentar de novo".
 *
 * @example <IdhDashboard data={panel} catalogHref="/catalog?category=desenvolvimento-social" />
 */
export const IdhDashboard = ({
  data,
  failed = false,
  catalogHref,
}: {
  data: IdhPanelData;
  failed?: boolean;
  catalogHref: string | null;
}) => {
  const ids = useIdhTabIds();
  const sticky = useIdhSticky();
  const layoutRef = useRef<HTMLDivElement>(null);
  const dashboard = useIdhDashboard(data, failed, () =>
    sticky.reveal(layoutRef.current),
  );
  const { tab, actions } = dashboard;
  const cardMenu = useCardMenuValue(data, tab, dashboard.pathname, catalogHref);
  const tabs = {
    panelId: ids.panel,
    active: tab,
    onSelect: dashboard.selectTab,
  };

  return (
    <>
      <IdhViewBar
        {...tabs}
        idPrefix={ids.bar}
        top={sticky.tabsTop}
        barRef={sticky.tabsRef}
      />
      <IdhFilterBar
        data={data}
        selection={dashboard.selection}
        visaoLabel={IDH_VISOES.find((item) => item.key === tab)?.label ?? ""}
        onChange={actions.changeFilters}
        onClear={actions.reset}
        isDefault={isDefaultFilters(data)}
        top={sticky.filterTop}
        stuck={sticky.stuck}
        barRef={sticky.filterRef}
      />
      <div
        ref={layoutRef}
        className={`${IDH_TEXT} mx-auto grid w-full max-w-[1440px] grid-cols-[223px_minmax(0,1fr)] max-[900px]:grid-cols-[minmax(0,1fr)]`}
      >
        <IdhViewRail {...tabs} idPrefix={ids.rail} top={sticky.railTop} />
        <div
          id={ids.panel}
          role="tabpanel"
          aria-labelledby={`${ids.rail}-${tab}`}
          className="min-w-0 pt-8 pr-20 pb-10 pl-7 max-[1100px]:pt-6 max-[1100px]:pr-8 max-[1100px]:pl-6 max-[900px]:px-4 max-[900px]:pt-5 max-[900px]:pb-8"
        >
          <IdhCardMenuContext.Provider value={cardMenu}>
            <IdhView
              tab={tab}
              data={data}
              selection={dashboard.selection}
              states={dashboard.states}
              onRetry={dashboard.retry}
              onReset={actions.reset}
              onSelectUf={actions.selectUf}
              onSelectYear={actions.selectYear}
            />
          </IdhCardMenuContext.Provider>
          <IdhPanelFooter
            tab={tab}
            catalogHref={catalogHref}
            nextViewTabIds={[`${ids.bar}-sexo`, `${ids.rail}-sexo`]}
            onSelectTab={dashboard.selectTab}
          />
        </div>
      </div>
    </>
  );
};
