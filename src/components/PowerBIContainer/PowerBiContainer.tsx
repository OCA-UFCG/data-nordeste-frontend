"use client";
import { ReportData } from "@/utils/interfaces";

const PowerBIContainer = ({
  panel,
  pageName,
}: {
  panel: { fields: ReportData };
  pageName?: string;
}) => {
  const { macroTheme, title, source, date } = panel.fields;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <div className="flex flex-col w-max h-full z-0 bg-white gap-2 overflow-x-scroll p-4">
      <div className="flex items-center justify-between w-full py-4">
        <h2 className="text-left font-semibold text-3xl">{macroTheme}</h2>
        <span className="font-medium text-base mt-auto">
          Publicado em: {formattedDate}
        </span>
      </div>
      <iframe
        src={pageName ? `${source}&pageName=${pageName}` : source}
        allowFullScreen={true}
        title={title}
        width="1184px"
        height="785px"
      />
    </div>
  );
};

export default PowerBIContainer;
