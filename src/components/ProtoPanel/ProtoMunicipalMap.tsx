"use client";

import { memo, type ReactNode } from "react";
import {
  DataTable,
  type DataTableContent,
} from "@/components/Panel/cards/DataTable";
import {
  ChoroplethCanvas,
  type ChoroplethCanvasProps,
} from "@/components/Panel/charts/ChoroplethMap";

const MUNICIPAL_MESH_URL = "/maps/municipios-sudene.json";

// 560 px é o `max-height` do mapa no protótipo (`.map-box`). Fixar a altura
// (em vez da proporção da malha) evita que o card cresça para ~1 200 px.
export const PROTO_MAP_BOX_CLASS =
  "h-[560px] w-full max-[1000px]:h-[480px] max-[700px]:h-[360px]";

// Variante `fill`: a caixa segue a altura que o card recebe da grade (com um
// mínimo) e o canvas a preenche, em vez de impor a altura.
const FILL_BOX_CLASS =
  "relative min-h-[360px] max-[1000px]:min-h-[480px] max-[700px]:min-h-[360px]";
const FILL_CANVAS_CLASS = "absolute inset-1 max-[1000px]:inset-2";

export type ProtoMunicipalCanvasProps = Omit<
  ChoroplethCanvasProps,
  "meshUrl" | "className" | "background"
> & {
  sea: string;

  // No palco da tela cheia o mapa ocupa tudo e pinta o próprio mar.
  stage?: boolean;

  // Ocupa a caixa `fill` do ProtoMunicipalMapBox, sem altura própria.
  fill?: boolean;
};

const canvasClass = (stage: boolean, fill: boolean) => {
  if (stage) return "size-full";

  return fill ? FILL_CANVAS_CLASS : PROTO_MAP_BOX_CLASS;
};

/**
 * Mapa dos municípios da Sudene em canvas, no tamanho da caixa do card ou do
 * palco da tela cheia (`renderStage` do `ProtoMapFullscreen`).
 *
 * @example <ProtoMunicipalCanvas label="Mapa" sea="#d6f1fa" regions={mapa} buckets={bins} valueLabel="PIB total" formatValue={formatPibReais} />
 */
export const ProtoMunicipalCanvas = ({
  sea,
  stage = false,
  fill = false,
  ...props
}: ProtoMunicipalCanvasProps) => (
  <ChoroplethCanvas
    {...props}
    meshUrl={MUNICIPAL_MESH_URL}
    className={canvasClass(stage, fill)}
    background={stage ? sea : undefined}
  />
);

// PERF: a tabela tem um item por município (~1 800). Com `memo`, ela só é
// refeita quando o conteúdo (memorizado por quem chama) muda, não a cada hover.
const MunicipalSrTable = memo(function MunicipalSrTable({
  content,
}: {
  content: DataTableContent;
}) {
  return (
    <div className="sr-only">
      <DataTable content={content} className="" />
    </div>
  );
});

/**
 * Caixa do mapa no card, com o fundo do mar. `table`: a tabela escondida que
 * dá aos leitores de tela o que o canvas não tem (revisão da PR #401).
 *
 * @example <ProtoMunicipalMapBox sea="#d6f1fa" table={table}><ProtoMunicipalCanvas {...map} /></ProtoMunicipalMapBox>
 */
export const ProtoMunicipalMapBox = ({
  sea,
  table,
  fill = false,
  children,
}: {
  sea: string;
  table?: DataTableContent;
  fill?: boolean;
  children: ReactNode;
}) => (
  <>
    <div
      className={`flex flex-1 items-center rounded-[8px] p-1 max-[1000px]:p-2 ${fill ? FILL_BOX_CLASS : ""}`}
      style={{ background: sea }}
    >
      {children}
    </div>
    {table ? <MunicipalSrTable content={table} /> : null}
  </>
);
