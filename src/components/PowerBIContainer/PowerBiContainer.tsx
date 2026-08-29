"use client";
import { useRef } from "react";
import { ReportData } from "@/utils/interfaces";
import { buildPowerBiSource } from "@/features/embeds/powerBi";
import { Icon } from "@/components/Icon/Icon";

const PowerBIContainer = ({
  panel,
  pageName,
}: {
  panel: ReportData;
  pageName?: string;
}) => {
  const { macroTheme, title, source, date, abovePanelDescription } = panel;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const openFullscreen = () => {
    iframeRef.current?.requestFullscreen();
  };

  return (
    <div className="flex flex-col w-full h-full z-0 bg-white gap-2 overflow-x-scroll p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center w-full py-4 sticky left-0">
        <h2 className="text-left font-semibold text-3xl">{macroTheme}</h2>
        <span className="font-medium text-base mt-2 sm:mt-0">
          Publicado em: {formattedDate}
        </span>
      </div>

      {abovePanelDescription && (
        <p className="w-full max-w-[1280px] text-base leading-[150%] text-[#292829]">
          {abovePanelDescription}
        </p>
      )}

      <button
        type="button"
        onClick={openFullscreen}
        className="flex items-center gap-2 self-end text-sm font-medium text-green-900 sm:hidden"
      >
        Ver em tela cheia
        <Icon id="expand" size={14} />
      </button>

      {/* IMPORTANT: pageName is a public query parameter, so keep URL encoding
      centralized here before passing the Power BI source into the iframe. */}
      <iframe
        ref={iframeRef}
        src={buildPowerBiSource(source, pageName)}
        loading="lazy"
        allowFullScreen
        title={title}
        className="aspect-[4/5] w-full h-auto sm:aspect-[32/25]"
      />
    </div>
  );
};

export default PowerBIContainer;
