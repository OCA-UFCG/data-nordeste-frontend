"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useDemografiaHighlight } from "@/components/DemografiaDashboard/DemografiaMapa";
import { PerfilPorteToggles } from "@/components/DemografiaDashboard/PerfilPorteToggles";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import { ProtoFullscreenButton } from "@/components/ProtoPanel/ProtoMapControls";
import {
  MAP_SELECT_HINT,
  ProtoMapFullscreen,
} from "@/components/ProtoPanel/ProtoMapFullscreen";
import {
  PROTO_MAP_BOX_CLASS,
  ProtoMunicipalCanvas,
  ProtoMunicipalMapBox,
} from "@/components/ProtoPanel/ProtoMunicipalMap";
import {
  ProtoStateMap,
  type ProtoStateMapProps,
} from "@/components/ProtoPanel/ProtoStateMap";
import {
  DEMOGRAFIA_PORTE_COLORS,
  DEMOGRAFIA_PORTES,
  populacaoPorMunicipio,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";
import { buildPerfilPorteTable } from "@/features/panels/demografia/perfilPorteTable";
import { formatPessoas } from "@/features/panels/format";
import { withYear } from "@/features/panels/territorialFilters";

const TITLE = "Porte populacional";
const INFO = (
  <>
    <p>
      Os <b>municípios</b> são classificados <b>por porte</b> populacional:
    </p>
    <ul className="mt-1 list-disc pl-5">
      <li>Pequeno porte, até 50 mil habitantes;</li>
      <li>Médio porte, entre 50 mil e 100 mil habitantes;</li>
      <li>Grande porte, acima de 100 mil habitantes.</li>
    </ul>
    <p className="mt-2">
      <b>Obs.:</b> Alguns municípios foram criados a partir do desmembramento de
      outros, o que explica a ausência de dados individualizados para esses
      municípios em censos demográficos anteriores à sua criação. Essas
      alterações territoriais devem ser consideradas na análise e na comparação
      dos dados populacionais ao longo do tempo.
    </p>
    <p>
      Na vista Estados, clique em um estado para usá-lo como filtro do painel.
    </p>
  </>
);
const MUNICIPIOS_LABEL = "Mapa dos municípios por porte";
const ESTADOS_LABEL = "Mapa dos estados do Nordeste";

// Literais: o mapa é canvas e a imagem do card não usa variáveis CSS.
const ESTADO_FILL = DEMOGRAFIA_PORTE_COLORS.pequeno;
const ESTADO_FILL_SELECTED = DEMOGRAFIA_PORTE_COLORS.medio;

// As duas vistas usam a mesma caixa de mapa. O card ainda muda de altura ao
// alternar pela legenda de porte, que só existe na vista Municípios.
const PERFIL_SEA = "#d4eef7";

type MapView = "municipios" | "estados";
type PorteHighlight = ReturnType<typeof useDemografiaHighlight>;
type PorteStage = ProtoStateMapProps | { renderStage: () => ReactNode };

const VIEWS: { key: MapView; label: string }[] = [
  { key: "municipios", label: "Municípios" },
  { key: "estados", label: "Estados" },
];

const ViewToggle = ({
  value,
  onChange,
}: {
  value: MapView;
  onChange: (view: MapView) => void;
}) => (
  <div
    role="group"
    aria-label="Mostrar no mapa"
    className="mb-3 inline-flex flex-none self-start overflow-hidden rounded-[6px] border border-grey-300"
  >
    {VIEWS.map((view) => (
      <button
        key={view.key}
        type="button"
        aria-pressed={view.key === value}
        onClick={() => onChange(view.key)}
        className="bg-white px-4 py-1.5 text-[13px] font-medium aria-pressed:bg-green-800 aria-pressed:text-white"
      >
        {view.label}
      </button>
    ))}
  </div>
);

// Escolher um estado no mapa filtra o painel; a cor marca os escolhidos. Eles
// vêm do filtro pedido, para o estado clicado ficar rosa antes da resposta.
const estadosMap = (
  data: DemografiaPanelData,
  selected: string[],
  onSelectUf: (uf: string) => void,
): ProtoStateMapProps => ({
  fillFor: (uf) => (selected.includes(uf) ? ESTADO_FILL_SELECTED : ESTADO_FILL),
  describe: (uf) => data.ufs.find((item) => item.sigla === uf)?.nome ?? uf,
  isSelectable: () => true,
  label: ESTADOS_LABEL,
  selectedUfs: selected,
  onSelect: onSelectUf,
});

// Os municípios do mapa são a área toda; o porte é o que se destaca.
const municipiosCanvas = (
  data: DemografiaPanelData,
  highlightCodes: ReadonlySet<string> | undefined,
  stage = false,
) => (
  <ProtoMunicipalCanvas
    label={MUNICIPIOS_LABEL}
    sea={PERFIL_SEA}
    stage={stage}
    regions={data.mapa}
    buckets={DEMOGRAFIA_PORTES}
    valueLabel="População"
    formatValue={formatPessoas}
    highlightCodes={highlightCodes}
  />
);

// A tela cheia do mapa de estados é o próprio `ProtoStateMap`; a de municípios
// recebe o palco pronto, que tem o próprio zoom.
const porteStage = (
  view: MapView,
  data: DemografiaPanelData,
  porte: PorteHighlight,
  estados: ProtoStateMapProps,
): PorteStage =>
  view === "estados"
    ? estados
    : {
        renderStage: () => municipiosCanvas(data, porte.highlightCodes, true),
      };

const PorteLegend = ({ porte }: { porte: PorteHighlight }) => (
  <PerfilPorteToggles
    grupos={porte.grupos}
    porte={porte.porte}
    onSelect={porte.setPorte}
    onPreview={porte.setPortePreview}
  />
);

const usePorteMapData = (
  data: DemografiaPanelData,
  selectedUfs: string[],
  onSelectUf: (uf: string) => void,
) => {
  const municipios = useMemo(
    () => populacaoPorMunicipio(data.mapa),
    [data.mapa],
  );
  const porte = useDemografiaHighlight(municipios);

  const table = useMemo(() => buildPerfilPorteTable(data), [data]);

  return { porte, table, estados: estadosMap(data, selectedUfs, onSelectUf) };
};

type PorteMapData = ReturnType<typeof usePorteMapData>;

// O mapa da vista escolhida; só a de municípios leva a tabela escondida.
const PorteMapBox = ({
  view,
  data,
  map,
}: {
  view: MapView;
  data: DemografiaPanelData;
  map: PorteMapData;
}) => (
  <ProtoMunicipalMapBox
    sea={PERFIL_SEA}
    table={view === "municipios" ? map.table : undefined}
  >
    {view === "estados" ? (
      <ProtoStateMap
        {...map.estados}
        className={`mx-auto block max-h-[560px] ${PROTO_MAP_BOX_CLASS}`}
      />
    ) : (
      municipiosCanvas(data, map.porte.highlightCodes)
    )}
  </ProtoMunicipalMapBox>
);

const PorteCardActions = ({
  state,
  onOpen,
}: {
  state: PerfilCardProps["state"];
  onOpen: () => void;
}) => (
  <>
    <ProtoFullscreenButton disabled={state !== "ok"} onClick={onOpen} />
    <ProtoCardInfo title={TITLE} text={INFO} />
    <ProtoCardMenu title={TITLE} />
  </>
);

// Tela cheia da vista aberta: só o mapa de estados filtra ao clicar, então só
// ele leva a dica.
const PorteFullscreen = ({
  view,
  data,
  map,
  ...frame
}: {
  view: MapView;
  data: DemografiaPanelData;
  map: PorteMapData;
  subtitle: string;
  legend: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <ProtoMapFullscreen
    {...frame}
    title={TITLE}
    hint={view === "estados" ? MAP_SELECT_HINT : undefined}
    {...porteStage(view, data, map.porte, map.estados)}
  />
);

/**
 * Vista e tela cheia do mapa de porte. Ficam no dashboard, não no card: a
 * troca entre a grade e o aviso de dados vazios monta o card de novo, e sem
 * isso a tela cheia fechava e a vista voltava para Municípios (revisão da PR #400).
 *
 * @example const porteView = usePorteMapView(); <PerfilPorteMapCard {...card} mapView={porteView} />
 */
export const usePorteMapView = () => {
  const [view, setView] = useState<MapView>("municipios");
  const [fullscreen, setFullscreen] = useState(false);

  return { view, setView, fullscreen, setFullscreen };
};

export type PorteMapView = ReturnType<typeof usePorteMapView>;

/**
 * Card "Porte populacional": mapa dos municípios por faixa de população ou
 * mapa dos estados, que filtra o painel ao ser clicado. A legenda por porte
 * destaca os municípios de cada faixa.
 *
 * @example <PerfilPorteMapCard data={panel} place="Nordeste" state="ok" onRetry={retry} selectedUfs={["PE"]} mapView={porteView} onSelectUf={toggleUf} />
 */
export const PerfilPorteMapCard = ({
  selectedUfs,
  mapView,
  onSelectUf,
  ...props
}: PerfilCardProps & {
  selectedUfs: string[];
  mapView: PorteMapView;
  onSelectUf: (uf: string) => void;
}) => {
  const { data, place, state } = props;
  const { view, setView, fullscreen, setFullscreen } = mapView;
  const map = usePorteMapData(data, selectedUfs, onSelectUf);
  const subtitle = withYear(place, data.filters.ano);

  // A legenda por porte só destaca municípios; no mapa de estados não teria
  // efeito, então some (revisão da PR #401).
  const legend =
    view === "municipios" ? <PorteLegend porte={map.porte} /> : null;

  // O diálogo fica no `overlay` do card: dentro do corpo, o esqueleto do
  // carregando o desmontaria a cada estado clicado em tela cheia.
  return (
    <ProtoCard
      title={TITLE}
      subtitle={subtitle}
      kind="map"
      state={state}
      onRetry={props.onRetry}
      bodyClassName="flex flex-col"
      actions={
        <PorteCardActions state={state} onOpen={() => setFullscreen(true)} />
      }
      overlay={
        <PorteFullscreen
          view={view}
          data={data}
          map={map}
          subtitle={subtitle}
          legend={legend}
          open={fullscreen}
          onOpenChange={setFullscreen}
        />
      }
    >
      <ViewToggle value={view} onChange={setView} />
      <PorteMapBox view={view} data={data} map={map} />
      {legend}
    </ProtoCard>
  );
};
