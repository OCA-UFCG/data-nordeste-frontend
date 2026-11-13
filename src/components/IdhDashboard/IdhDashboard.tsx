"use client";

import Link from "next/link";
import { useId, useMemo, useRef } from "react";
import { IdhFilterBar } from "@/components/IdhDashboard/IdhFilterBar";
import { IdhGroupView } from "@/components/IdhDashboard/IdhGroupView";
import { IdhNextViewButton } from "@/components/IdhDashboard/IdhNextViewButton";
import { IdhOverview } from "@/components/IdhDashboard/IdhOverview";
import { IdhViewBar, IdhViewRail } from "@/components/IdhDashboard/IdhViewTabs";
import { IDH_CARD_SOURCE } from "@/components/IdhDashboard/idhTheme";
import {
  type IdhDashboardModel,
  useIdhDashboard,
} from "@/components/IdhDashboard/useIdhDashboard";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import {
  BUTTON,
  PROTO_TEXT,
  protoToneStyle,
} from "@/components/ProtoPanel/protoStyles";
import { ProtoToneContext } from "@/components/ProtoPanel/protoTone";
import { useProtoSticky } from "@/components/ProtoPanel/useProtoSticky";
import {
  buildIdhSearch,
  DEFAULT_IDH_FILTERS,
  describeIdhShareChips,
  IDH_VISOES,
  type IdhPanelData,
  type IdhVisao,
} from "@/features/panels/idh/idhPanel";
import { cn } from "@/lib/utils";

// Fonte do painel no protótipo, abaixo dos cards.
const PANEL_SOURCE =
  "Fonte dos dados: Pesquisa Nacional por Amostra de Domicílios Contínua (PNAD/IBGE) · Data Nordeste";

// Coluna lateral das visões e o conteúdo; abaixo de 900 px, uma coluna só.
const LAYOUT_CLASS = `${PROTO_TEXT} mx-auto grid w-full max-w-[1440px] grid-cols-[223px_minmax(0,1fr)] max-[900px]:grid-cols-[minmax(0,1fr)]`;

const TAB_PANEL_CLASS =
  "min-w-0 pt-8 pr-20 pb-10 pl-7 max-[1100px]:pt-6 max-[1100px]:pr-8 max-[1100px]:pl-6 max-[900px]:px-4 max-[900px]:pt-5 max-[900px]:pb-8";

// O link de compartilhar leva a aba aberta, não a da carga da página: trocar de
// aba só muda a URL com replaceState, sem novos `data.filters`.
const useCardMenuValue = (
  data: IdhPanelData,
  tab: IdhVisao,
  pathname: string,
  catalogHref: string | null,
): ProtoCardMenuContextValue =>
  useMemo(
    () => ({
      share: {
        path: `${pathname}${buildIdhSearch({ ...data.filters, visao: tab })}`,
        chips: describeIdhShareChips(data, tab),
      },
      catalogHref,
      imageSource: IDH_CARD_SOURCE,
    }),
    [data, tab, pathname, catalogHref],
  );

const useIdhTabIds = () => {
  const idPrefix = useId();

  return {
    rail: `${idPrefix}-rail`,
    bar: `${idPrefix}-tab`,
    panel: `${idPrefix}-panel`,
  };
};

type IdhTabIds = ReturnType<typeof useIdhTabIds>;

type ViewProps = { data: IdhPanelData; dashboard: IdhDashboardModel };

const IdhGeneralView = ({ data, dashboard }: ViewProps) => (
  <IdhOverview
    data={data}
    selection={dashboard.selection}
    states={dashboard.states}
    onRetry={dashboard.retry}
    onSelectUf={dashboard.actions.selectUf}
    onSelectYear={dashboard.actions.selectYear}
  />
);

const IdhView = ({ data, dashboard }: ViewProps) =>
  dashboard.tab === "geral" ? (
    <IdhGeneralView data={data} dashboard={dashboard} />
  ) : (
    <IdhGroupView
      visao={dashboard.tab}
      data={data}
      state={dashboard.states.groups}
      onRetry={dashboard.retry}
      onReset={dashboard.actions.reset}
    />
  );

const isDefaultFilters = ({ filters }: IdhPanelData) =>
  filters.ano === DEFAULT_IDH_FILTERS.ano && !filters.uf;

const visaoLabel = (tab: IdhVisao) =>
  IDH_VISOES.find((item) => item.key === tab)?.label ?? "";

type IdhStickyBars = ReturnType<typeof useProtoSticky>;

type PanelProps = ViewProps & { ids: IdhTabIds; catalogHref: string | null };

const tabsOf = ({ ids, dashboard }: PanelProps) => ({
  panelId: ids.panel,
  active: dashboard.tab,
  onSelect: dashboard.selectTab,
});

const IdhDashboardFilterBar = ({
  sticky,
  data,
  dashboard,
}: PanelProps & { sticky: IdhStickyBars }) => (
  <IdhFilterBar
    data={data}
    selection={dashboard.selection}
    visaoLabel={visaoLabel(dashboard.tab)}
    onChange={dashboard.actions.changeFilters}
    onClear={dashboard.actions.reset}
    isDefault={isDefaultFilters(data)}
    top={sticky.filterTop}
    stuck={sticky.stuck}
    barRef={sticky.filterRef}
  />
);

// Barra de abas (celular e tablet) e barra de filtros, as duas grudam no topo.
const IdhDashboardBars = (props: PanelProps & { sticky: IdhStickyBars }) => (
  <>
    <IdhViewBar
      {...tabsOf(props)}
      idPrefix={props.ids.bar}
      top={props.sticky.tabsTop}
      barRef={props.sticky.tabsRef}
    />
    <IdhDashboardFilterBar {...props} />
  </>
);

const CatalogButton = ({ href }: { href: string | null }) => (
  <Link href={href ?? "/catalog"} className={cn(BUTTON, "mt-4 flex w-full")}>
    Acessar o catálogo de dados
  </Link>
);

// Na visão geral, o convite para a visão por sexo, que foca a aba dela.
const NextViewInvite = ({ ids, dashboard }: PanelProps) =>
  dashboard.tab === "geral" ? (
    <IdhNextViewButton
      visao="sexo"
      tabIds={[`${ids.bar}-sexo`, `${ids.rail}-sexo`]}
      onSelect={dashboard.selectTab}
    />
  ) : null;

// Fonte, link do catálogo e o convite para a próxima visão.
const IdhPanelFooter = (props: PanelProps) => (
  <>
    <p className="mt-4 text-xs leading-4 text-grey-1100">{PANEL_SOURCE}</p>
    <CatalogButton href={props.catalogHref} />
    <NextViewInvite {...props} />
  </>
);

// Coluna lateral das visões (acima de 900 px), grudada abaixo dos filtros.
const IdhDashboardRail = (props: PanelProps & { top: number }) => (
  <IdhViewRail {...tabsOf(props)} idPrefix={props.ids.rail} top={props.top} />
);

const IdhCardsWithMenu = ({ data, dashboard, catalogHref }: PanelProps) => {
  const { tab, pathname } = dashboard;
  const cardMenu = useCardMenuValue(data, tab, pathname, catalogHref);

  return (
    <ProtoCardMenuContext.Provider value={cardMenu}>
      <IdhView data={data} dashboard={dashboard} />
    </ProtoCardMenuContext.Provider>
  );
};

const IdhTabPanel = (props: PanelProps) => (
  <div
    id={props.ids.panel}
    role="tabpanel"
    aria-labelledby={`${props.ids.rail}-${props.dashboard.tab}`}
    className={TAB_PANEL_CLASS}
  >
    <IdhCardsWithMenu {...props} />
    <IdhPanelFooter {...props} />
  </div>
);

type IdhDashboardProps = {
  data: IdhPanelData;
  failed?: boolean;
  catalogHref: string | null;
};

/**
 * Painel de IDH no formato do protótipo: barra de abas (celular e tablet),
 * barra de filtros, coluna lateral das visões e o conteúdo da visão. `failed`:
 * a consulta falhou e os cards mostram o erro com "Tentar de novo".
 *
 * @example <IdhDashboard data={panel} catalogHref="/catalog?category=desenvolvimento-social" />
 */
export const IdhDashboard = (props: IdhDashboardProps) => {
  const ids = useIdhTabIds();
  const sticky = useProtoSticky();
  const layoutRef = useRef<HTMLDivElement>(null);
  const reveal = () => sticky.reveal(layoutRef.current);
  const dashboard = useIdhDashboard(props.data, !!props.failed, reveal);
  const { data, catalogHref } = props;
  const panel = { data, catalogHref, dashboard, ids };

  return (
    <ProtoToneContext.Provider value="idh">
      <IdhDashboardBars {...panel} sticky={sticky} />
      <div
        ref={layoutRef}
        style={protoToneStyle("idh")}
        className={LAYOUT_CLASS}
      >
        <IdhDashboardRail {...panel} top={sticky.railTop} />
        <IdhTabPanel {...panel} />
      </div>
    </ProtoToneContext.Provider>
  );
};
