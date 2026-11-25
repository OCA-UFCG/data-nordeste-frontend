import type { Feature, FeatureCollection, Position } from "geojson";
import { escapeXml } from "@/features/panels/chartImage";
import type { MapPosterInset } from "@/features/panels/mapPosterData";
import { textWidth, truncateText } from "@/features/panels/mapPosterText";

export type InsetBox = { x: number; y: number; width: number; height: number };
export type Bbox = [number, number, number, number];
export type Project = (lon: number, lat: number) => [number, number];

const LABEL_SIZE = 6.5;
const LABEL_MIN_SIZE = 5;
const LABEL_WEIGHT = 700;
const LABEL_SIDE = 4;
const LABEL_ZONE = 12;
const PADDING = 5;

// Pontos mais próximos que isto (px) do anterior não mudam o desenho de um
// quadro de ~70 px e só engordam o SVG: os estados vêm com milhares de vértices.
const MIN_STEP = 0.6;
const CONTEXT_FILL = "#d9dadc";
const FRAME_STROKE = "#d4d4d4";

const polygonsOf = (feature: Feature): Position[][][] => {
  const geometry = feature.geometry;

  if (geometry?.type === "Polygon") return [geometry.coordinates];
  if (geometry?.type === "MultiPolygon") return geometry.coordinates;

  return [];
};

const ringsOf = (feature: Feature): Position[][] => polygonsOf(feature).flat();

const extend = (bbox: Bbox | null, [lon, lat]: Position): Bbox =>
  bbox
    ? [
        Math.min(bbox[0], lon),
        Math.min(bbox[1], lat),
        Math.max(bbox[2], lon),
        Math.max(bbox[3], lat),
      ]
    : [lon, lat, lon, lat];

/**
 * Caixa [oeste, sul, leste, norte] dos polígonos; null sem nenhum.
 *
 * @example bboxOf(estados) // [-48.8, -18.3, -34.8, -1]
 */
export const bboxOf = (collection: FeatureCollection): Bbox | null =>
  collection.features.flatMap(ringsOf).flat().reduce<Bbox | null>(extend, null);

/**
 * Projeção equirretangular com o cosseno da latitude média, para o desenho não
 * sair esticado: encaixa a caixa em `box` (menos `pad`) centralizada. O norte
 * fica em cima (y do SVG cresce para baixo).
 *
 * @example makeProjector([-48, -18, -35, -1], { x: 0, y: 0, width: 70, height: 60 }, 5)(-40, -8)
 */
export const makeProjector = (
  [west, south, east, north]: Bbox,
  box: InsetBox,
  pad: number,
): Project => {
  const kx = Math.cos((((south + north) / 2) * Math.PI) / 180);
  const worldW = Math.max((east - west) * kx, 1e-6);
  const worldH = Math.max(north - south, 1e-6);
  const scale = Math.min(
    (box.width - pad * 2) / worldW,
    (box.height - pad * 2) / worldH,
  );
  const left = box.x + (box.width - worldW * scale) / 2;
  const top = box.y + (box.height - worldH * scale) / 2;

  return (lon, lat) => [
    left + (lon - west) * kx * scale,
    top + (north - lat) * scale,
  ];
};

const fmt = (value: number) => String(Number(value.toFixed(1)));

/**
 * Anel GeoJSON como comando de path SVG fechado, sem os pontos quase
 * sobrepostos. Vazio se sobrarem menos de três.
 *
 * @example ringPath([[0, 0], [10, 0], [10, 10], [0, 0]], project) // "M0 0L10 0L10 -10Z"
 */
export const ringPath = (ring: Position[], project: Project): string => {
  const points: [number, number][] = [];

  for (const [lon, lat] of ring) {
    const point = project(lon, lat);
    const last = points[points.length - 1];

    if (!last || Math.hypot(point[0] - last[0], point[1] - last[1]) >= MIN_STEP)
      points.push(point);
  }
  if (points.length < 3) return "";

  return `M${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L")}Z`;
};

const featurePath = (feature: Feature, project: Project): string =>
  ringsOf(feature)
    .map((ring) => ringPath(ring, project))
    .join("");

const overlaps = (feature: Feature, project: Project, area: InsetBox) => {
  const bbox = bboxOf({ type: "FeatureCollection", features: [feature] });

  if (!bbox) return false;
  const [x1, y1] = project(bbox[0], bbox[3]);
  const [x2, y2] = project(bbox[2], bbox[1]);

  return (
    x2 >= area.x &&
    x1 <= area.x + area.width &&
    y2 >= area.y &&
    y1 <= area.y + area.height
  );
};

const paths = (
  collection: FeatureCollection,
  project: Project,
  attributes: string,
  area?: InsetBox,
): string =>
  collection.features
    .filter((feature) => !area || overlaps(feature, project, area))
    .map((feature) => ({ d: featurePath(feature, project) }))
    .filter(({ d }) => d)
    .map(({ d }) => `<path ${attributes} d="${d}"/>`)
    .join("");

/**
 * Fonte e texto do rótulo para caberem no quadro. O nome do recorte varia de
 * "Ceará" a "Rio Grande do Norte", e o quadro tem largura fixa: encolhe a
 * fonte até `LABEL_MIN_SIZE` e, se ainda assim não couber, corta com
 * reticências.
 *
 * @example fitLabel("Recorte: Pernambuco", 68) // { size: 5.7, text: "Recorte: Pernambuco" }
 */
export const fitLabel = (
  label: string,
  boxWidth: number,
): { size: number; text: string } => {
  const room = boxWidth - LABEL_SIDE * 2;
  const natural = textWidth(label, LABEL_SIZE, LABEL_WEIGHT);
  const fitted = Math.floor(((LABEL_SIZE * room) / natural) * 100) / 100;
  const size = natural <= room ? LABEL_SIZE : Math.max(LABEL_MIN_SIZE, fitted);

  return { size, text: truncateText(label, room, size, LABEL_WEIGHT) };
};

/**
 * Quadro do mini-mapa de recorte: os estados em cinza ao fundo (só os que
 * entram no quadro), o recorte na cor do painel e o rótulo embaixo. Vazio sem
 * nada a destacar.
 *
 * @example buildInsetSvg(inset, "#e5640f", { x: 14, y: 130, width: 66, height: 68 }, "poster")
 */
export const buildInsetSvg = (
  inset: MapPosterInset,
  accent: string,
  box: InsetBox,
  idPrefix: string,
): string => {
  const bbox = bboxOf(inset.highlight);

  if (!bbox) return "";
  const area = { ...box, height: box.height - LABEL_ZONE };
  const project = makeProjector(bbox, area, PADDING);
  const clipId = `${idPrefix}-inset-clip`;
  const label = fitLabel(inset.label, box.width);

  return [
    `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="#ffffff" stroke="${FRAME_STROKE}" stroke-width="0.8"/>`,
    `<clipPath id="${clipId}"><rect x="${area.x}" y="${area.y}" width="${area.width}" height="${area.height}"/></clipPath>`,
    `<g clip-path="url(#${clipId})">`,
    paths(
      inset.context,
      project,
      `data-ctx="" fill="${CONTEXT_FILL}" stroke="#ffffff" stroke-width="0.4"`,
      area,
    ),
    paths(
      inset.highlight,
      project,
      `fill="${accent}" stroke="#ffffff" stroke-width="0.5"`,
    ),
    "</g>",
    `<text x="${box.x + LABEL_SIDE}" y="${box.y + box.height - 4}" font-family="Inter, Arial, sans-serif" font-size="${label.size}" font-weight="${LABEL_WEIGHT}" fill="${accent}">${escapeXml(label.text)}</text>`,
  ].join("");
};
