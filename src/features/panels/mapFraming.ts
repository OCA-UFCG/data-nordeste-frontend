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

/**
 * Square box around the selected municipalities, zoomed out so their
 * neighbours stay visible. Codes missing from the mesh are ignored.
 * @example getSelectionFocusBounds(visible, ["2611606", "2607901"])
 */
export const getSelectionFocusBounds = (
  features: MapFeature[],
  cdMuns: string[],
): MapBounds | undefined => {
  const points: LonLat[] = [];

  for (const feature of selectMapFeatures(features, cdMuns)) {
    collectPoints(feature.geometry.coordinates, points);
  }
  if (!points.length) return undefined;
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

// Menor vista permitida, em graus: o mesmo fundo de zoom de antes desta regra.
const MIN_VIEW_SPAN = 0.02;

export type MapFocus = { center: LonLat; zoom: number };
export type MapFraming = {
  bounds: MapBounds;
  maxZoom: number;
  focus?: MapFocus;
};
type ViewSpan = { lon: number; lat: number };

const spanWidth = ([[west], [east]]: MapBounds) => east - west;
const spanHeight = ([[, north], [, south]]: MapBounds) => north - south;
const centreOf = ([[west, north], [east, south]]: MapBounds): LonLat => [
  (west + east) / 2,
  (north + south) / 2,
];

// O que o quadro mostra no zoom 1: a área encaixada (contain) no formato dele.
const getViewSpan = (area: MapBounds, boxRatio: number): ViewSpan => {
  const scale = getAspectScale(area);
  const lon = spanWidth(area);
  const lat = spanHeight(area);

  return (lon * scale) / lat > boxRatio
    ? { lon, lat: (lon * scale) / boxRatio }
    : { lon: (lat * boxRatio) / scale, lat };
};

const getMaxZoom = (area: MapBounds, view: ViewSpan) =>
  Math.max(
    1,
    Math.min(view.lon * getAspectScale(area), view.lat) / MIN_VIEW_SPAN,
  );

const isInside = (
  [lon, lat]: LonLat,
  [[west, north], [east, south]]: MapBounds,
) => lon >= west && lon <= east && lat >= south && lat <= north;

// Vista maior que a área nesse eixo: fica no meio, como no zoom 1.
const clampCentre = (value: number, min: number, max: number, half: number) =>
  2 * half >= max - min
    ? (min + max) / 2
    : Math.min(max - half, Math.max(min + half, value));

const clampToArea = (
  [lon, lat]: LonLat,
  [[west, north], [east, south]]: MapBounds,
  view: ViewSpan,
  zoom: number,
): LonLat => [
  clampCentre(lon, west, east, view.lon / (2 * zoom)),
  clampCentre(lat, south, north, view.lat / (2 * zoom)),
];

const getMapFocus = (
  area: MapBounds,
  view: ViewSpan,
  maxZoom: number,
  focus: MapBounds,
): MapFocus => {
  const fit = Math.min(
    view.lon / spanWidth(focus),
    view.lat / spanHeight(focus),
  );
  const zoom = Math.min(maxZoom, Math.max(1, fit));
  const centre = centreOf(focus);

  // Foco fora da área (Fernando de Noronha) não é preso, senão some da vista.
  return {
    center: isInside(centre, area)
      ? clampToArea(centre, area, view, zoom)
      : centre,
    zoom,
  };
};

// Zoom sobre a área inteira, para o zoom-out continuar chegando até ela.
export const getMapFraming = (
  area: MapBounds,
  boxRatio: number,
  focus?: MapBounds,
): MapFraming => {
  const view = getViewSpan(area, boxRatio);
  const maxZoom = getMaxZoom(area, view);

  return {
    bounds: area,
    maxZoom,
    ...(focus ? { focus: getMapFocus(area, view, maxZoom, focus) } : {}),
  };
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
