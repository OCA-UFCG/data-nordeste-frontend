import { MUTED_COLOR, TEXT_COLOR } from "@/features/panels/chartBase";
import { escapeXml } from "@/features/panels/chartImage";
import type { MapPosterData } from "@/features/panels/mapPosterData";
import { buildInsetSvg } from "@/features/panels/mapPosterInset";
import {
  flowRows,
  textWidth,
  truncateText,
  wrapWords,
} from "@/features/panels/mapPosterText";

export const POSTER_WIDTH = 500;
export const POSTER_SITE_HOST = "datanordeste.sudene.gov.br";

export type MapPosterMap = { dataUrl: string; width: number; height: number };

// `iconMarkup`: os traços do ícone do painel (`protoIconMarkup`); chega pronto
// para este módulo não depender de componentes React.
export type MapPosterAssets = {
  logoDataUrl: string;
  iconMarkup: string;
  siteUrl?: string;
};

type Section = { svg: string; y: number };
type Ink = { size: number; weight: number; fill: string; anchor?: "end" };

const MARGIN = 20;
const CONTENT = POSTER_WIDTH - MARGIN * 2;
const FONT = "Inter, Arial, sans-serif";
const RULE = "#e6e6e6";
const LEGEND_INK = "#4b4b4b";
const LOGO = { width: 64, height: 30.4 };
const INSET = { x: 14, y: 12, width: 68, height: 72 };
const MIN_MAP_FOR_INSET = 120;

const INK = {
  panel: { size: 13, weight: 500, fill: TEXT_COLOR },
  title: { size: 20, weight: 700, fill: TEXT_COLOR },
  subtitle: { size: 11.5, weight: 400, fill: MUTED_COLOR },
  filters: { size: 8.5, weight: 700, fill: TEXT_COLOR },
  chip: { size: 8, weight: 600, fill: TEXT_COLOR },
  legend: { size: 9, weight: 400, fill: LEGEND_INK },
  source: { size: 8, weight: 400, fill: LEGEND_INK },
  updated: { size: 7.5, weight: 400, fill: MUTED_COLOR },
  site: { size: 8.5, weight: 600, fill: TEXT_COLOR },
} satisfies Record<string, Ink>;

const text = (x: number, y: number, content: string, ink: Ink): string =>
  `<text x="${x}" y="${y}" font-size="${ink.size}" font-weight="${ink.weight}" fill="${ink.fill}"${ink.anchor ? ` text-anchor="${ink.anchor}"` : ""}>${escapeXml(content)}</text>`;

const rule = (y: number): string =>
  `<line x1="${MARGIN}" y1="${y}" x2="${MARGIN + CONTENT}" y2="${y}" stroke="${RULE}" stroke-width="1"/>`;

// Mistura `hex` (#rrggbb) com `other` (0–255 por canal): a cor dos chips sai do
// destaque do painel, sem uma paleta por painel.
const mix = (hex: string, other: number, ratio: number): string => {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);

  if (!match) {
    throw new Error(
      `Poster accent "${hex}" is not a #rrggbb color; expected one of PROTO_TONES.`,
    );
  }
  const channels = [0, 2, 4].map((at) =>
    parseInt(match[1].slice(at, at + 2), 16),
  );

  return `#${channels
    .map((value) =>
      Math.round(value * (1 - ratio) + other * ratio)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

const header = (data: MapPosterData, icon: string, y: number): Section => ({
  svg: [
    `<rect x="${MARGIN}" y="${y}" width="22" height="22" rx="5" fill="${data.accent}"/>`,
    `<g transform="translate(${MARGIN + 3.6} ${y + 3.6}) scale(0.6)" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icon}</g>`,
    text(MARGIN + 30, y + 15.5, data.panelName, INK.panel),
  ].join(""),
  y: y + 22,
});

const titleLines = (data: MapPosterData, y: number): Section => {
  const { size, weight } = INK.title;
  const lines = wrapWords(data.title, CONTENT, size, weight, 2);
  const svg = lines.map((line, i) =>
    text(MARGIN, y + 20 + i * 24, line, INK.title),
  );

  return { svg: svg.join(""), y: y + 20 + (lines.length - 1) * 24 };
};

const subtitle = (data: MapPosterData, y: number): Section => {
  const { size, weight } = INK.subtitle;
  const line = truncateText(data.subtitle, CONTENT, size, weight);

  return { svg: text(MARGIN, y + 18, line, INK.subtitle), y: y + 18 };
};

const CHIP_PADDING = 12;
const CHIP_HEIGHT = 15;
const CHIP_ROW = 21;
const CHIP_GAP = 6;

// "Filtros aplicados" e os chips na cor do painel; o que não couber na linha
// desce, alinhado ao primeiro chip.
const chips = (data: MapPosterData, y: number): Section => {
  if (data.chips.length === 0) return { svg: "", y };
  const top = y + 10;
  const labelWidth = textWidth(
    "Filtros aplicados",
    INK.filters.size,
    INK.filters.weight,
  );
  const startX = MARGIN + labelWidth + 10;
  const maxChip = MARGIN + CONTENT - startX;
  const labels = data.chips.map((chip) =>
    truncateText(chip, maxChip - CHIP_PADDING, INK.chip.size, INK.chip.weight),
  );
  const items = labels.map((label) => ({
    label,
    width: textWidth(label, INK.chip.size, INK.chip.weight) + CHIP_PADDING,
  }));
  const rows = flowRows(items, MARGIN + CONTENT - startX, CHIP_GAP);
  const colors = {
    fill: mix(data.accent, 255, 0.88),
    stroke: mix(data.accent, 255, 0.6),
    ink: mix(data.accent, 0, 0.25),
  };
  const svg = rows.flatMap((row, r) => {
    let x = startX;

    return row.map((index) => {
      const item = items[index];
      const chipY = top + r * CHIP_ROW;
      const out = chip(item, x, chipY, colors);

      x += item.width + CHIP_GAP;

      return out;
    });
  });

  return {
    svg: [
      text(MARGIN, top + 11, "Filtros aplicados", INK.filters),
      ...svg,
    ].join(""),
    y: top + CHIP_HEIGHT + (rows.length - 1) * CHIP_ROW,
  };
};

const chip = (
  item: { label: string; width: number },
  x: number,
  y: number,
  colors: { fill: string; stroke: string; ink: string },
): string =>
  [
    `<rect x="${x}" y="${y}" width="${item.width}" height="${CHIP_HEIGHT}" rx="8" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="0.8"/>`,
    text(x + CHIP_PADDING / 2, y + 10.5, item.label, {
      ...INK.chip,
      fill: colors.ink,
    }),
  ].join("");

const mapBlock = (
  data: MapPosterData,
  map: MapPosterMap,
  y: number,
): Section => {
  const height = (CONTENT * map.height) / map.width;
  const inset =
    data.inset && height >= MIN_MAP_FOR_INSET
      ? buildInsetSvg(
          data.inset,
          data.accent,
          { ...INSET, x: MARGIN + INSET.x, y: y + INSET.y },
          "poster",
        )
      : "";

  return {
    svg: [
      `<clipPath id="poster-map-clip"><rect x="${MARGIN}" y="${y}" width="${CONTENT}" height="${height}" rx="4"/></clipPath>`,
      `<image href="${escapeXml(map.dataUrl)}" x="${MARGIN}" y="${y}" width="${CONTENT}" height="${height}" preserveAspectRatio="none" clip-path="url(#poster-map-clip)"/>`,
      inset,
    ].join(""),
    y: y + height,
  };
};

const LEGEND_ROW = 16;

// Bolinha e rótulo de cada faixa, em linha; sem contagem de feições.
const legend = (data: MapPosterData, y: number): Section => {
  if (data.legend.length === 0) return { svg: "", y };
  const { size, weight } = INK.legend;
  const items = data.legend.map((entry) => ({
    ...entry,
    width: 13 + textWidth(entry.label, size, weight),
  }));
  const svg = flowRows(items, CONTENT, 16).flatMap((row, r) => {
    let x = MARGIN;

    return row.map((index) => {
      const item = items[index];
      const baseline = y + 21 + r * LEGEND_ROW;
      const out = `<circle cx="${x + 4}" cy="${baseline - 3.3}" r="4" fill="${item.color}"/>${text(x + 13, baseline, item.label, INK.legend)}`;

      x += item.width + 16;

      return out;
    });
  });
  const rows = Math.ceil(svg.length ? flowRows(items, CONTENT, 16).length : 0);

  return { svg: svg.join(""), y: y + 21 + (rows - 1) * LEGEND_ROW };
};

// Rodapé: fonte e data à esquerda; logo e endereço à direita, alinhados pela
// linha de base do endereço.
const footer = (
  data: MapPosterData,
  assets: MapPosterAssets,
  y: number,
): Section => {
  const top = y + 10;
  const logoBottom = top + LOGO.height;
  const base = logoBottom + 11;
  const rightX = MARGIN + CONTENT;
  const sourceWidth = CONTENT - LOGO.width - 24;
  const sourceLines = wrapWords(
    data.source,
    sourceWidth,
    INK.source.size,
    INK.source.weight,
    2,
  );
  const lastSource = data.updatedAt ? base - 12 : base;
  const source = sourceLines.map((line, i) =>
    text(
      MARGIN,
      lastSource - (sourceLines.length - 1 - i) * 11,
      line,
      INK.source,
    ),
  );
  const updated = data.updatedAt
    ? text(MARGIN, base, `Atualizado em ${data.updatedAt}`, INK.updated)
    : "";

  return {
    svg: [
      `<image href="${escapeXml(assets.logoDataUrl)}" x="${rightX - LOGO.width}" y="${top}" width="${LOGO.width}" height="${LOGO.height}" preserveAspectRatio="xMaxYMid meet"/>`,
      text(rightX, base, assets.siteUrl ?? POSTER_SITE_HOST, {
        ...INK.site,
        anchor: "end",
      }),
      ...source,
      updated,
    ].join(""),
    y: base + 28,
  };
};

/**
 * Cartaz de download do mapa em SVG: cabeçalho do painel, título, filtros
 * aplicados, o mapa com o recorte, a legenda e o rodapé. Largura fixa; a altura
 * segue a proporção do mapa. O PNG é este mesmo SVG rasterizado.
 *
 * @example buildMapPosterSvg(data, { dataUrl, width: 640, height: 480 }, { logoDataUrl, iconMarkup }).height
 */
export const buildMapPosterSvg = (
  data: MapPosterData,
  map: MapPosterMap,
  assets: MapPosterAssets,
): { svg: string; width: number; height: number } => {
  if (!(map.width > 0 && map.height > 0)) {
    throw new Error(
      `Map image is ${map.width}×${map.height}; expected a positive size to lay out the poster.`,
    );
  }
  const head = header(data, assets.iconMarkup, 16);
  const title = titleLines(data, head.y);
  const sub = subtitle(data, title.y);
  const filters = chips(data, sub.y);
  const mapTop = filters.y + 10 + 11;
  const picture = mapBlock(data, map, mapTop);
  const key = legend(data, picture.y);
  const bottomRule = key.y + 16;
  const foot = footer(data, assets, bottomRule);
  const height = Math.ceil(foot.y);

  return {
    svg: [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${height}" viewBox="0 0 ${POSTER_WIDTH} ${height}" font-family="${FONT}">`,
      `<rect width="100%" height="100%" fill="#ffffff"/>`,
      head.svg,
      title.svg,
      sub.svg,
      filters.svg,
      rule(filters.y + 10),
      picture.svg,
      key.svg,
      rule(bottomRule),
      foot.svg,
      "</svg>",
    ].join(""),
    width: POSTER_WIDTH,
    height,
  };
};
