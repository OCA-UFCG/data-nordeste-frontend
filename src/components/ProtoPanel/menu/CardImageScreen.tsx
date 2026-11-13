"use client";

import { useState } from "react";
import {
  MENU_ACTION_CLASS,
  MenuLabel,
  MenuScreen,
  MenuStatus,
} from "@/components/ProtoPanel/menu/CardMenuParts";
import type { ChartImageFormat } from "@/features/panels/chartImage";
import { type ChartImageSource, downloadChartImage } from "@/lib/chartImage";

// `getSource`: o gráfico na tela, ou null se ele ainda não foi desenhado.
export type CardImage = {
  getSource: () => ChartImageSource | null;
  source: string;
};

type DownloadState = "idle" | "busy" | "done" | "failed";

const DOWNLOAD_MESSAGES: Record<DownloadState, string> = {
  idle: "",
  busy: "",
  done: "Imagem baixada.",
  failed: "Não foi possível gerar a imagem. Tente de novo.",
};

const FORMATS: readonly ChartImageFormat[] = ["png", "svg"];

// `.prev`: miniatura do que vai no arquivo (título e fonte, se marcados).
const ImagePreview = ({
  title,
  source,
  framed,
}: {
  title: string;
  source: string;
  framed: boolean;
}) => (
  <div
    aria-hidden="true"
    className="rounded-[6px] border border-grey-300 bg-white p-2.5 text-[11px]"
  >
    {framed ? <div className="text-xs font-semibold">{title}</div> : null}
    <div className="my-2 h-14 rounded bg-[repeating-linear-gradient(90deg,var(--proto-accent-soft)_0_18px,#fff_18px_22px)]" />
    {framed ? <div>{source}</div> : null}
  </div>
);

const FormatPicker = ({
  value,
  onChange,
}: {
  value: ChartImageFormat;
  onChange: (format: ChartImageFormat) => void;
}) => (
  <div
    role="group"
    aria-label="Formato"
    className="inline-flex overflow-hidden rounded-[6px] border border-grey-300"
  >
    {FORMATS.map((format) => (
      <button
        key={format}
        type="button"
        aria-pressed={format === value}
        onClick={() => onChange(format)}
        className="bg-white px-4 py-1.5 text-[13px] font-medium aria-pressed:bg-green-800 aria-pressed:text-white"
      >
        {format.toUpperCase()}
      </button>
    ))}
  </div>
);

const useChartDownload = (title: string, image: CardImage) => {
  const [state, setState] = useState<DownloadState>("idle");
  const download = (format: ChartImageFormat, framed: boolean) => {
    const source = image.getSource();

    if (!source) return setState("failed");
    setState("busy");
    downloadChartImage(source, { format, title, source: image.source, framed })
      .then(() => setState("done"))
      .catch(() => setState("failed"));
  };

  return { state, download };
};

/**
 * Tela "Baixar imagem" do menu do card: pré-visualização, formato, título e
 * fonte opcionais e o botão que gera o arquivo.
 *
 * @example <CardImageScreen title="Mapa do IDH por estado" image={{ getSource, source }} onBack={back} />
 */
export const CardImageScreen = ({
  title,
  image,
  onBack,
}: {
  title: string;
  image: CardImage;
  onBack: () => void;
}) => {
  const [format, setFormat] = useState<ChartImageFormat>("png");
  const [framed, setFramed] = useState(true);
  const { state, download } = useChartDownload(title, image);

  return (
    <MenuScreen title="Baixar imagem" onBack={onBack}>
      <ImagePreview title={title} source={image.source} framed={framed} />
      <MenuLabel>Formato</MenuLabel>
      <FormatPicker value={format} onChange={setFormat} />
      <label className="my-3 flex items-center gap-2 text-[13.5px]">
        <input
          type="checkbox"
          checked={framed}
          onChange={(event) => setFramed(event.target.checked)}
          className="size-[18px] accent-green-800"
        />
        Incluir título e fonte
      </label>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={() => download(format, framed)}
        className={MENU_ACTION_CLASS}
      >
        {state === "busy" ? "Gerando imagem…" : "Baixar imagem"}
      </button>
      <MenuStatus message={DOWNLOAD_MESSAGES[state]} />
    </MenuScreen>
  );
};
