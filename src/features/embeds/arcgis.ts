export const ARC_GIS_ID_PATTERN = /^[0-9a-f]{32}$/i;

export const isValidArcGisId = (value: string): boolean =>
  ARC_GIS_ID_PATTERN.test(value);

export const buildStoryMapSource = (id: string): string =>
  `https://storymaps.arcgis.com/stories/${id}`;

export const buildExperienceSource = (id: string): string =>
  `https://experience.arcgis.com/experience/${id}`;

const isArcGisEmbedPath = (url: URL): boolean => {
  const hostname = url.hostname.toLowerCase();

  return (
    (hostname.endsWith("storymaps.arcgis.com") &&
      url.pathname.startsWith("/stories/")) ||
    (hostname.endsWith("experience.arcgis.com") &&
      url.pathname.startsWith("/experience/"))
  );
};

export const addArcGisEmbedQueryIfMissing = (source: string): string => {
  try {
    const url = new URL(source);

    // IMPORTANT: ArcGIS embed routes depend on embed=true to render as framed
    // experiences instead of full navigation pages.
    if (isArcGisEmbedPath(url) && !url.searchParams.has("embed")) {
      url.searchParams.set("embed", "true");
    }

    return url.toString();
  } catch {
    return source;
  }
};

export const getArcGisInternalEmbedHref = (source: string): string | null => {
  try {
    const url = new URL(source);
    const hostname = url.hostname.toLowerCase();

    if (hostname.endsWith("storymaps.arcgis.com")) {
      const match = url.pathname.match(/\/stories\/([0-9a-f]{32})/i);

      return match?.[1] ? `/data-stories/${match[1]}` : null;
    }

    if (hostname.endsWith("experience.arcgis.com")) {
      const match = url.pathname.match(/\/experience\/([0-9a-f]{32})/i);

      return match?.[1] ? `/experience/${match[1]}` : null;
    }

    return null;
  } catch {
    return null;
  }
};
