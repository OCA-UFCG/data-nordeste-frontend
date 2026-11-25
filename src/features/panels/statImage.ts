import { MUTED_COLOR, TEXT_COLOR } from "@/features/panels/chartBase";
import { escapeXml } from "@/features/panels/chartImage";

export type StatImageDirection = "up" | "down" | "flat";

// O que o card do indicador mostra; o mesmo formato de ProtoStatCell.
export type StatImageInput = {
  value: string | null;
  caption?: string;
  pill?: { text: string; direction: StatImageDirection } | null;
};

// SVG pronto e o tamanho dele em px CSS; a moldura (título e fonte) vem depois.
export type StatImageMarkup = { svg: string; width: number; height: number };

type StatTextStyle = { size: number; weight: number; color: string };

const VALUE_STYLE = { size: 30, weight: 700, color: TEXT_COLOR };
const EMPTY_VALUE_STYLE = { ...VALUE_STYLE, color: "#b7b3b5" };
const CAPTION_STYLE = { size: 12, weight: 400, color: MUTED_COLOR };
const VALUE_BASELINE = 30;
const CAPTION_BASELINE = 52;
const PILL = { top: 62, height: 20, size: 12, padX: 9, arrow: 12, gap: 4 };
const MIN_WIDTH = 320;

// O SVG não mede texto: a largura sai da média de um caractere (fração da
// fonte), com folga para os números em negrito.
const CHAR_EM = 0.62;

// As mesmas cores da variação no card (PILL_CLASS em ProtoStatCards).
const PILL_COLORS = {
  up: { fill: "#e3f7ea", text: "#085f2d" },
  down: { fill: "#ffe1e3", text: "#8f0f18" },
  flat: { fill: "#efefef", text: "#3e3c3d" },
} as const;

const estimateTextWidth = (text: string, size: number) =>
  Math.ceil(text.length * size * CHAR_EM);

const statText = (text: string, x: number, y: number, style: StatTextStyle) =>
  `<text x="${x}" y="${y}" font-family="Inter, sans-serif" font-size="${style.size}" font-weight="${style.weight}" fill="${style.color}">${escapeXml(text)}</text>`;

const pillWidth = (pill: NonNullable<StatImageInput["pill"]>) => {
  const arrow = pill.direction === "flat" ? 0 : PILL.arrow + PILL.gap;

  return PILL.padX * 2 + arrow + estimateTextWidth(pill.text, PILL.size);
};

// A seta do ícone `up` (caixa 24) reduzida a 12 px; a de queda gira 90°.
const pillArrow = (direction: StatImageDirection, color: string) => {
  if (direction === "flat") return "";
  const turn = direction === "down" ? " rotate(90 12 12)" : "";

  return `<path d="M7 17L17 7M9 7h8v8" transform="translate(${PILL.padX} ${PILL.top + 4}) scale(0.5)${turn}" fill="none" stroke="${color}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>`;
};

const pillMarkup = (pill: NonNullable<StatImageInput["pill"]>) => {
  const colors = PILL_COLORS[pill.direction];
  const textX =
    PILL.padX + (pill.direction === "flat" ? 0 : PILL.arrow + PILL.gap);
  const style = { size: PILL.size, weight: 700, color: colors.text };

  return [
    `<rect x="0" y="${PILL.top}" width="${pillWidth(pill)}" height="${PILL.height}" rx="${PILL.height / 2}" fill="${colors.fill}"/>`,
    pillArrow(pill.direction, colors.text),
    statText(pill.text, textX, PILL.top + 14, style),
  ].join("");
};

// Como o card: sem valor, "—" e "sem dado neste ano", sem variação.
const statImageLines = (input: StatImageInput) =>
  input.value === null
    ? { value: "—", caption: "sem dado neste ano", pill: null }
    : { value: input.value, caption: input.caption, pill: input.pill ?? null };

const statImageHeight = (lines: ReturnType<typeof statImageLines>) => {
  if (lines.pill) return PILL.top + PILL.height;

  return lines.caption ? CAPTION_BASELINE + 6 : VALUE_BASELINE + 8;
};

const statImageWidth = (lines: ReturnType<typeof statImageLines>) =>
  Math.max(
    MIN_WIDTH,
    estimateTextWidth(lines.value, VALUE_STYLE.size),
    lines.caption ? estimateTextWidth(lines.caption, CAPTION_STYLE.size) : 0,
    lines.pill ? pillWidth(lines.pill) : 0,
  );

/**
 * Indicador (big number) desenhado em SVG para o "Baixar imagem": valor,
 * legenda e variação, como no card. Na tela o card é HTML, que o caminho de
 * exportação dos gráficos (um `<svg>` da página) não consegue copiar; por isso
 * ele é redesenhado aqui a partir dos mesmos dados.
 *
 * @example buildStatImage({ value: "54,6 mi", caption: "em 2022", pill: { text: "+3,2%", direction: "up" } }).svg
 */
export const buildStatImage = (input: StatImageInput): StatImageMarkup => {
  const lines = statImageLines(input);
  const width = statImageWidth(lines);
  const height = statImageHeight(lines);
  const valueStyle = input.value === null ? EMPTY_VALUE_STYLE : VALUE_STYLE;

  return {
    width,
    height,
    svg: [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      statText(lines.value, 0, VALUE_BASELINE, valueStyle),
      lines.caption
        ? statText(lines.caption, 0, CAPTION_BASELINE, CAPTION_STYLE)
        : "",
      lines.pill ? pillMarkup(lines.pill) : "",
      "</svg>",
    ].join(""),
  };
};
