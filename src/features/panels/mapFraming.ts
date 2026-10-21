export type LonLat = [number, number];
export type MapBounds = [LonLat, LonLat];

type GeometryCoordinates = number[] | GeometryCoordinates[];

export type MapFeature = {
  properties: { name: string; uf: string };
  geometry: { coordinates: GeometryCoordinates };
};

const FRAMING_EXCLUDED = new Set(["2605459"]);

const collectPoints = (coordinates: GeometryCoordinates, out: LonLat[]) => {
  if (typeof coordinates[0] === "number") {
    out.push(coordinates as LonLat);

    return;
  }
  for (const part of coordinates as GeometryCoordinates[]) {
    collectPoints(part, out);
  }
};

const boundsOf = (points: LonLat[]): MapBounds => {
  const lons = points.map(([lon]) => lon);
  const lats = points.map(([, lat]) => lat);

  return [
    [Math.min(...lons), Math.max(...lats)],
    [Math.max(...lons), Math.min(...lats)],
  ];
};

export const selectMapFeatures = (
  features: MapFeature[],
  cdMuns: string[],
): MapFeature[] => {
  const wanted = new Set(cdMuns);

  return features.filter((feature) => wanted.has(feature.properties.name));
};

export const mapNameFor = (prefix: string, cdMuns: string[]): string =>
  `${prefix}:${[...cdMuns].sort().join(",")}`;

export const getMapBounds = (features: MapFeature[]): MapBounds | undefined => {
  const points: LonLat[] = [];

  for (const feature of features) {
    if (FRAMING_EXCLUDED.has(feature.properties.name)) continue;
    collectPoints(feature.geometry.coordinates, points);
  }

  return points.length ? boundsOf(points) : undefined;
};

const FOCUS_ZOOM_OUT = 3;
const MIN_FOCUS_HALF_SPAN = 0.3;

export const getMunicipalityFocusBounds = (
  features: MapFeature[],
  cdMun: string,
): MapBounds | undefined => {
  const feature = features.find((item) => item.properties.name === cdMun);

  if (!feature) return undefined;
  const points: LonLat[] = [];

  collectPoints(feature.geometry.coordinates, points);
  const [[west, north], [east, south]] = boundsOf(points);
  const scale = getAspectScale([
    [west, north],
    [east, south],
  ]);
  const halfSpan = Math.max(
    MIN_FOCUS_HALF_SPAN,
    (Math.max((east - west) * scale, north - south) / 2) * FOCUS_ZOOM_OUT,
  );
  const [lon, lat] = [(west + east) / 2, (north + south) / 2];

  return [
    [lon - halfSpan / scale, lat + halfSpan],
    [lon + halfSpan / scale, lat - halfSpan],
  ];
};

export const getAspectScale = (bounds: MapBounds): number => {
  const centreLat = (bounds[0][1] + bounds[1][1]) / 2;

  return Math.cos((centreLat * Math.PI) / 180);
};

const MIN_MAP_RATIO = 0.75;
const MAX_MAP_RATIO = 1.6;

export const getMapAspectRatio = (bounds: MapBounds | undefined): number => {
  if (!bounds) return MIN_MAP_RATIO;
  const width = (bounds[1][0] - bounds[0][0]) * getAspectScale(bounds);
  const height = bounds[0][1] - bounds[1][1];

  return Math.min(MAX_MAP_RATIO, Math.max(MIN_MAP_RATIO, width / height));
};
