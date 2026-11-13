"use client";

import { useMemo, useState } from "react";
import { PerfilPorteToggles } from "@/components/DemografiaDashboard/PerfilPorteToggles";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import { useDemografiaHighlight } from "@/components/DemografiaDashboard/DemografiaMapa";
import { ChoroplethCanvas } from "@/components/Panel/charts/ChoroplethMap";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ProtoMapFullscreen } from "@/components/ProtoPanel/ProtoMapFullscreen";
import {
  ProtoStateMap,
  type ProtoStateMapProps,
} from "@/components/ProtoPanel/ProtoStateMap";
import { ICON_BUTTON } from "@/components/ProtoPanel/protoStyles";
import {
  DEMOGRAFIA_PORTES,
  populacaoPorMunicipio,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";
import { formatPessoas } from "@/features/panels/format";

const TITLE = "Porte dos municípios";
const INFO =
  "Classifica os municípios do território por faixa de população (pequeno, médio e grande). Clique em um estado para usá-lo como filtro do painel.";
const MESH_URL = "/maps/municipios-sudene.json";
const MUNICIPIOS_LABEL = "Mapa dos municípios por porte";
const ESTADOS_LABEL = "Mapa dos estados do Nordeste";

// Literais: o mapa é canvas e a imagem do card não usa variáveis CSS.
const ESTADO_FILL = "#f6d3e0";
const ESTADO_FILL_SELECTED = "#e98dae";

type MapView = "municipios" | "estados";

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

// Escolher um estado no mapa filtra o painel; a cor marca os já escolhidos.
const estadosMap = (
  data: DemografiaPanelData,
  onSelectUf: (uf: string) => void,
): ProtoStateMapProps => {
  const selected = data.filters.uf ?? [];

  return {
    fillFor: (uf) =>
      selected.includes(uf) ? ESTADO_FILL_SELECTED : ESTADO_FILL,
    describe: (uf) => data.ufs.find((item) => item.sigla === uf)?.nome ?? uf,
    isSelectable: () => true,
    label: ESTADOS_LABEL,
    selectedUfs: selected,
    onSelect: onSelectUf,
  };
};

// Os municípios do mapa são a área toda; o porte é o que se destaca.
const municipiosCanvas = (
  data: DemografiaPanelData,
  highlightCodes: ReadonlySet<string> | undefined,
  className?: string,
) => (
  <ChoroplethCanvas
    label={MUNICIPIOS_LABEL}
    meshUrl={MESH_URL}
    regions={data.mapa}
    buckets={DEMOGRAFIA_PORTES}
    valueLabel="População"
    formatValue={formatPessoas}
    highlightCodes={highlightCodes}
    className={className}
  />
);

/**
 * Card "Porte dos municípios": mapa dos municípios por faixa de população ou
 * mapa dos estados, que filtra o painel ao ser clicado. A legenda por porte
 * destaca os municípios de cada faixa.
 *
 * @example <PerfilPorteMapCard data={panel} place="Nordeste" state="ok" onRetry={retry} onSelectUf={toggleUf} />
 */
export const PerfilPorteMapCard = ({
  onSelectUf,
  ...props
}: PerfilCardProps & { onSelectUf: (uf: string) => void }) => {
  const { data, place, state } = props;
  const [view, setView] = useState<MapView>("municipios");
  const [fullscreen, setFullscreen] = useState(false);
  const municipios = useMemo(
    () => populacaoPorMunicipio(data.mapa),
    [data.mapa],
  );
  const porte = useDemografiaHighlight(municipios);
  const estados = estadosMap(data, onSelectUf);
  const subtitle = `${place} · ${data.filters.ano}`;
  const legend = (
    <PerfilPorteToggles
      grupos={porte.grupos}
      porte={porte.porte}
      onSelect={porte.setPorte}
      onPreview={porte.setPortePreview}
    />
  );

  return (
    <ProtoCard
      title={TITLE}
      subtitle={subtitle}
      kind="map"
      state={state}
      onRetry={props.onRetry}
      bodyClassName="flex flex-col"
      actions={
        <>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label="Abrir mapa em tela cheia"
            title="Tela cheia"
            disabled={state !== "ok"}
            onClick={() => setFullscreen(true)}
            className={ICON_BUTTON}
          >
            <ProtoIcon name="fullscreen" size={18} stroke={1.7} />
          </button>
          <ProtoCardInfo title={TITLE} text={INFO} />
          <ProtoCardMenu title={TITLE} />
        </>
      }
    >
      <ViewToggle value={view} onChange={setView} />
      <div className="flex flex-1 items-center rounded-[8px] bg-[#d4eef7] p-1 max-[1000px]:p-2">
        {view === "estados" ? (
          <ProtoStateMap {...estados} />
        ) : (
          municipiosCanvas(data, porte.highlightCodes)
        )}
      </div>
      {legend}
      <ProtoMapFullscreen
        open={fullscreen}
        onOpenChange={setFullscreen}
        title={TITLE}
        subtitle={subtitle}
        legend={legend}
        {...(view === "estados"
          ? estados
          : {
              renderStage: () => (
                <div className="relative h-[min(640px,calc(100vh-250px))] min-h-[300px] rounded-[8px] bg-[#d4eef7] max-[700px]:h-[70vh]">
                  {municipiosCanvas(data, porte.highlightCodes, "size-full")}
                </div>
              ),
            })}
      />
    </ProtoCard>
  );
};
