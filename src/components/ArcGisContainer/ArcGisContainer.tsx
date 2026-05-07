"use client";

import { addArcGisEmbedQueryIfMissing } from "@/features/embeds/arcgis";

type ArcGisContainerProps = {
  source: string;
  title?: string;
  date?: string | null;
  allow?: string;
};

const ArcGisContainer = ({
  source,
  title,
  date,
  allow = "geolocation",
}: ArcGisContainerProps) => {
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <div className="flex flex-col w-full h-[calc(100vh-80px)] min-h-0 z-0 bg-white">
      {(title || formattedDate) && (
        <div className="flex flex-col sm:flex-row justify-between items-center w-full px-4 py-4">
          <h2 className="text-left font-semibold text-3xl">{title}</h2>
          {formattedDate && (
            <span className="font-medium text-base mt-2 sm:mt-0">
              Publicado em: {formattedDate}
            </span>
          )}
        </div>
      )}

      <iframe
        src={addArcGisEmbedQueryIfMissing(source)}
        allowFullScreen
        allow={allow}
        title={title || "ArcGIS"}
        className="w-full flex-1 min-h-0 border-0"
      />
    </div>
  );
};

export default ArcGisContainer;
