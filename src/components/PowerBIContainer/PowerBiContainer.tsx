"use client";
import { useRef } from "react";
import { ReportData } from "@/utils/interfaces";
import { buildPowerBiSource } from "@/features/embeds/powerBi";
import { Icon } from "@/components/Icon/Icon";
import { PanelIntro } from "@/components/Panel/PanelTexts";

const PowerBIContainer = ({
  panel,
  pageName,
}: {
  panel: ReportData;
  pageName?: string;
}) => {
  const { title, source } = panel;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const openFullscreen = () => {
    iframeRef.current?.requestFullscreen();
  };

  return (
    <div className="flex flex-col w-full h-full z-0 bg-white gap-2 overflow-x-scroll p-4">
      <PanelIntro panel={panel} />

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
