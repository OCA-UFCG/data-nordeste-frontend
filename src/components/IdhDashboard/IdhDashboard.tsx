"use client";

import Link from "next/link";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { IDH_CARD_SOURCE } from "@/components/IdhDashboard/idhCardTexts";
import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import { ProtoToneContext } from "@/components/ProtoPanel/protoTone";
import { IdhFilterBar } from "@/components/IdhDashboard/IdhFilterBar";
import { IdhGroupView } from "@/components/IdhDashboard/IdhGroupView";
import { IdhNextViewButton } from "@/components/IdhDashboard/IdhNextViewButton";
import { IdhOverview } from "@/components/IdhDashboard/IdhOverview";
import { IdhViewBar, IdhViewRail } from "@/components/IdhDashboard/IdhViewTabs";
import {
  BUTTON,
  PROTO_TEXT,
  protoToneStyle,
} from "@/components/ProtoPanel/protoStyles";
import { useProtoRetry } from "@/components/ProtoPanel/useProtoRetry";
import { useProtoSticky } from "@/components/ProtoPanel/useProtoSticky";
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

type ViewProps = {
  tab: IdhVisao;
  data: IdhPanelData;
  state: ProtoCardState;
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
      state={props.state}
      onRetry={props.onRetry}
      onReset={onReset}
    />
  );

const isDefaultFilters = ({ filters }: IdhPanelData) =>
  filters.ano === DEFAULT_IDH_FILTERS.ano && !filters.uf;

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
  const idPrefix = useId();
  const ids = {
    rail: `${idPrefix}-rail`,
    bar: `${idPrefix}-tab`,
    panel: `${idPrefix}-panel`,
  };
  const [tab, setTab] = useState<IdhVisao>(data.filters.visao);
  const navigation = useIdhNavigation();
  const { retrying, retry } = useProtoRetry();
  const sticky = useProtoSticky();
  const layoutRef = useRef<HTMLDivElement>(null);
  const cardMenu = useCardMenuValue(
    data,
    tab,
    navigation.pathname,
    catalogHref,
  );
  const state: ProtoCardState = failed
    ? "error"
    : navigation.isPending || retrying
      ? "loading"
      : "ok";
  const selectTab = (visao: IdhVisao) => {
    if (visao === tab) return;
    setTab(visao);
    navigation.showVisao({ ...data.filters, visao });
    sticky.reveal(layoutRef.current);
  };
  const changeFilters = (next: IdhFilters) =>
    navigation.applyFilters({ ...next, visao: tab });
  const tabs = { panelId: ids.panel, active: tab, onSelect: selectTab };

  return (
    <ProtoToneContext.Provider value="idh">
      <IdhViewBar
        {...tabs}
        idPrefix={ids.bar}
        top={sticky.tabsTop}
        barRef={sticky.tabsRef}
      />
      <IdhFilterBar
        data={data}
        visaoLabel={IDH_VISOES.find((item) => item.key === tab)?.label ?? ""}
        onChange={changeFilters}
        onClear={() => changeFilters(DEFAULT_IDH_FILTERS)}
        isDefault={isDefaultFilters(data)}
        top={sticky.filterTop}
        stuck={sticky.stuck}
        barRef={sticky.filterRef}
      />
      <div
        ref={layoutRef}
        style={protoToneStyle("idh")}
        className={`${PROTO_TEXT} mx-auto grid w-full max-w-[1440px] grid-cols-[223px_minmax(0,1fr)] max-[900px]:grid-cols-[minmax(0,1fr)]`}
      >
        <IdhViewRail {...tabs} idPrefix={ids.rail} top={sticky.railTop} />
        <div
          id={ids.panel}
          role="tabpanel"
          aria-labelledby={`${ids.rail}-${tab}`}
          className="min-w-0 pt-8 pr-20 pb-10 pl-7 max-[1100px]:pt-6 max-[1100px]:pr-8 max-[1100px]:pl-6 max-[900px]:px-4 max-[900px]:pt-5 max-[900px]:pb-8"
        >
          <ProtoCardMenuContext.Provider value={cardMenu}>
            <IdhView
              tab={tab}
              data={data}
              state={state}
              onRetry={retry}
              onReset={() => changeFilters(DEFAULT_IDH_FILTERS)}
              onSelectUf={(uf) =>
                changeFilters({
                  ...data.filters,
                  uf: data.filters.uf === uf ? undefined : uf,
                })
              }
              onSelectYear={(ano) => changeFilters({ ...data.filters, ano })}
            />
          </ProtoCardMenuContext.Provider>
          <p className="mt-4 text-xs leading-4 text-grey-1100">
            {PANEL_SOURCE}
          </p>
          <Link
            href={catalogHref ?? "/catalog"}
            className={cn(BUTTON, "mt-4 flex w-full")}
          >
            Acessar o catálogo de dados
          </Link>
          {tab === "geral" ? (
            <IdhNextViewButton
              visao="sexo"
              tabIds={[`${ids.bar}-sexo`, `${ids.rail}-sexo`]}
              onSelect={selectTab}
            />
          ) : null}
        </div>
      </div>
    </ProtoToneContext.Provider>
  );
};
