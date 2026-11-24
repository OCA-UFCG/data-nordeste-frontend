"use client";

import Link from "next/link";
import { useId, useMemo, useRef } from "react";
import { IdhFilterBar } from "@/components/IdhDashboard/IdhFilterBar";
import { IdhGroupView } from "@/components/IdhDashboard/IdhGroupView";
import { IdhNextViewButton } from "@/components/IdhDashboard/IdhNextViewButton";
import { IdhOverview } from "@/components/IdhDashboard/IdhOverview";
import { IdhViewBar } from "@/components/IdhDashboard/IdhViewTabs";
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
  WRAP,
} from "@/components/ProtoPanel/protoStyles";
import { ProtoToneContext } from "@/components/ProtoPanel/protoTone";
import { useProtoSticky } from "@/components/ProtoPanel/useProtoSticky";
import {
  buildIdhSearch,
  describeIdhShareChips,
  IDH_VISOES,
  type IdhPanelData,
  type IdhVisao,
} from "@/features/panels/idh/idhPanel";
import { cn } from "@/lib/utils";

// Fonte do painel no protótipo, abaixo dos cards.
const PANEL_SOURCE =
  "Fonte dos dados: Pesquisa Nacional por Amostra de Domicílios Contínua (PNAD/IBGE) · Data Nordeste";

// `.layout` e `.panel` do protótipo: as margens do `.wrap` e 32/24/20 px no topo.
const LAYOUT_CLASS = `${PROTO_TEXT} ${WRAP} pt-8 pb-10 max-[1100px]:pt-6 max-[700px]:pt-5 max-[700px]:pb-8`;

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
        path: `${pathname}${buildIdhSearch({ ...data.filters, visao: tab }, data.yearRange)}`,
        chips: describeIdhShareChips(data, tab),
      },
      catalogHref,
      imageSource: IDH_CARD_SOURCE,
    }),
    [data, tab, pathname, catalogHref],
  );

const useIdhTabIds = () => {
  const idPrefix = useId();

  return { bar: `${idPrefix}-tab`, panel: `${idPrefix}-panel` };
};

type IdhTabIds = ReturnType<typeof useIdhTabIds>;

type ViewProps = {
  data: IdhPanelData;
  dashboard: IdhDashboardModel;
  updatedAt?: string;
};

const IdhGeneralView = ({ data, dashboard, updatedAt }: ViewProps) => (
  <IdhOverview
    data={data}
    updatedAt={updatedAt}
    selection={dashboard.selection}
    states={dashboard.states}
    onRetry={dashboard.retry}
    onSelectUf={dashboard.actions.selectUf}
    onSelectYear={dashboard.actions.selectYear}
    onFiltersChange={dashboard.actions.changeFilters}
  />
);

const IdhView = ({ data, dashboard, updatedAt }: ViewProps) =>
  dashboard.tab === "geral" ? (
    <IdhGeneralView data={data} dashboard={dashboard} updatedAt={updatedAt} />
  ) : (
    <IdhGroupView
      visao={dashboard.tab}
      data={data}
      updatedAt={updatedAt}
      state={dashboard.states.groups}
      onRetry={dashboard.retry}
      onReset={dashboard.actions.reset}
    />
  );

const isDefaultFilters = ({ filters, yearRange }: IdhPanelData) =>
  filters.ano === yearRange.last && !filters.uf;

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

// Abas acima dos filtros; só a barra de filtros gruda no topo.
const IdhDashboardBars = (props: PanelProps & { sticky: IdhStickyBars }) => (
  <>
    <IdhViewBar {...tabsOf(props)} idPrefix={props.ids.bar} />
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
      tabId={`${ids.bar}-sexo`}
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

const IdhCardsWithMenu = ({
  data,
  dashboard,
  catalogHref,
  updatedAt,
}: PanelProps) => {
  const { tab, pathname } = dashboard;
  const cardMenu = useCardMenuValue(data, tab, pathname, catalogHref);

  return (
    <ProtoCardMenuContext.Provider value={cardMenu}>
      <IdhView data={data} dashboard={dashboard} updatedAt={updatedAt} />
    </ProtoCardMenuContext.Provider>
  );
};

const IdhTabPanel = (props: PanelProps) => (
  <div
    id={props.ids.panel}
    role="tabpanel"
    aria-labelledby={`${props.ids.bar}-${props.dashboard.tab}`}
  >
    <IdhCardsWithMenu {...props} />
  </div>
);

type IdhDashboardProps = {
  data: IdhPanelData;
  failed?: boolean;
  catalogHref: string | null;
  updatedAt?: string;
};

/**
 * Painel de IDH no formato do protótipo: barra de abas, barra de filtros e o
 * conteúdo da visão, com a fonte e o catálogo abaixo. `failed`:
 * a consulta falhou e os cards mostram o erro com "Tentar de novo".
 * `updatedAt`: "MM/AAAA" do rodapé dos cards; sem ele, o rótulo some.
 *
 * @example <IdhDashboard data={panel} catalogHref="/catalog?category=desenvolvimento-social" />
 */
export const IdhDashboard = (props: IdhDashboardProps) => {
  const ids = useIdhTabIds();
  const sticky = useProtoSticky();
  const layoutRef = useRef<HTMLDivElement>(null);
  const reveal = () => sticky.reveal(layoutRef.current);
  const dashboard = useIdhDashboard(props.data, !!props.failed, reveal);
  const { data, catalogHref, updatedAt } = props;
  const panel = { data, catalogHref, dashboard, ids, updatedAt };

  return (
    <ProtoToneContext.Provider value="idh">
      <IdhDashboardBars {...panel} sticky={sticky} />
      <div
        ref={layoutRef}
        style={protoToneStyle("idh")}
        className={LAYOUT_CLASS}
      >
        <IdhTabPanel {...panel} />
        <IdhPanelFooter {...panel} />
      </div>
    </ProtoToneContext.Provider>
  );
};
