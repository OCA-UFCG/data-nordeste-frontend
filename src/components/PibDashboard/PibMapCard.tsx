"use client";

import { useMemo, useState } from "react";
import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import { PIB_CARD_INFO } from "@/components/PibDashboard/pibTexts";
import { PIB_COLORS } from "@/components/PibDashboard/pibTheme";
import { ProtoCard, ProtoSkeleton } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import { ProtoCardMenu } from "@/components/ProtoPanel/ProtoCardMenu";
import {
  ProtoBinLegend,
  ProtoFullscreenButton,
} from "@/components/ProtoPanel/ProtoMapControls";
import { ProtoMapFullscreen } from "@/components/ProtoPanel/ProtoMapFullscreen";
import {
  MUNICIPAL_MAP_BOX_CLASS,
  ProtoMunicipalCanvas,
  ProtoMunicipalMapBox,
} from "@/components/ProtoPanel/ProtoMunicipalMap";
import { formatPibReais } from "@/features/panels/pib/pibFormat";
import {
  buildPibMunicipalTable,
  PIB_MUNICIPAL_BINS,
  pibMapFocus,
  type PibMapFocus,
} from "@/features/panels/pib/pibMunicipios";

export const PIB_MAP_TITLE = "PIB total por município";

// O mapa pronto: a caixa com a altura do mapa e a legenda (em duas linhas no
// celular).
const MAP_SKELETON = (
  <>
    <div className="p-1">
      <ProtoSkeleton className={MUNICIPAL_MAP_BOX_CLASS} />
    </div>
    <ProtoSkeleton className="mt-3 h-4 w-[60%] max-[700px]:h-10" />
  </>
);

type PibMapSource = Pick<PibCardProps, "data" | "place"> & {
  focus: PibMapFocus;
};

const pibCanvas = ({ data, place, focus }: PibMapSource, stage = false) => (
  <ProtoMunicipalCanvas
    {...focus}
    label={`Mapa do ${PIB_MAP_TITLE}, ${place}`}
    sea={PIB_COLORS.sea}
    stage={stage}
    regions={data.mapa}
    buckets={PIB_MUNICIPAL_BINS}
    valueLabel="PIB total"
    formatValue={formatPibReais}
  />
);

/**
 * Card "PIB total por município": cada município da área (ou dos estados do
 * filtro) na cor da faixa do seu PIB total. Os municípios do filtro ficam em
 * destaque; o clique não filtra, como no mapa de municípios do perfil.
 * `selectedMuns`: os municípios do filtro pedido, destacados na hora.
 *
 * @example <PibMapCard data={panel} place="Nordeste · Recife (PE)" selectedMuns={["2611606"]} state="ok" onRetry={retry} />
 */
export const PibMapCard = ({
  data,
  place,
  selectedMuns,
  ...status
}: PibCardProps & { selectedMuns: string[] }) => {
  const munKey = selectedMuns.join(",");

  // PERF: um Set novo a cada render refaria as cores dos ~1 800 municípios.
  const focus = useMemo(
    () => pibMapFocus(munKey ? munKey.split(",") : []),
    [munKey],
  );
  const source = { data, place, focus };
  const [fullscreen, setFullscreen] = useState(false);
  const table = useMemo(() => buildPibMunicipalTable(data), [data]);
  const subtitle = `PIB total por município · ${place} · ${data.filters.ano}`;

  return (
    <ProtoCard
      {...status}
      title={PIB_MAP_TITLE}
      subtitle={subtitle}
      kind="map"
      skeleton={MAP_SKELETON}
      bodyClassName="flex flex-col"
      overlay={
        <ProtoMapFullscreen
          open={fullscreen}
          onOpenChange={setFullscreen}
          title={PIB_MAP_TITLE}
          subtitle={subtitle}
          legend={<ProtoBinLegend bins={PIB_MUNICIPAL_BINS} className="" />}
          renderStage={() => pibCanvas(source, true)}
        />
      }
      actions={
        <>
          <ProtoFullscreenButton
            disabled={status.state === "loading" || status.state === "error"}
            onClick={() => setFullscreen(true)}
          />
          <ProtoCardInfo title={PIB_MAP_TITLE} text={PIB_CARD_INFO.map} />
          <ProtoCardMenu title={PIB_MAP_TITLE} />
        </>
      }
    >
      <ProtoMunicipalMapBox sea={PIB_COLORS.sea} table={table}>
        {pibCanvas(source)}
      </ProtoMunicipalMapBox>
      <ProtoBinLegend bins={PIB_MUNICIPAL_BINS} />
    </ProtoCard>
  );
};
