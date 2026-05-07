"use client";
import { ReportData } from "@/utils/interfaces";

const buildPowerBiSource = (source: string, pageName?: string): string => {
  if (!pageName) return source;

  try {
    const url = new URL(source);
    url.searchParams.set("pageName", pageName);

    return url.toString();
  } catch {
    const separator = source.includes("?") ? "&" : "?";

    return `${source}${separator}pageName=${encodeURIComponent(pageName)}`;
  }
};

const PowerBIContainer = ({
  panel,
  pageName,
}: {
  panel: ReportData;
  pageName?: string;
}) => {
  const { macroTheme, title, source, date } = panel;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <div className="flex flex-col w-full max-w-[1240px] h-full z-0 bg-white gap-2 overflow-x-scroll p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center w-full py-4 sticky left-0">
        <h2 className="text-left font-semibold text-3xl">{macroTheme}</h2>
        <span className="font-medium text-base mt-2 sm:mt-0">
          Publicado em: {formattedDate}
        </span>
      </div>

      {/* IMPORTANT: pageName is a public query parameter, so keep URL encoding
      centralized here before passing the Power BI source into the iframe. */}
      <iframe
        src={buildPowerBiSource(source, pageName)}
        allowFullScreen
        title={title}
        className="w-full aspect-[32/25] h-auto"
      />
    </div>
  );
};

export default PowerBIContainer;
