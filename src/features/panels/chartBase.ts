import type { ChartOption } from "@/lib/echarts";

export type ValueFormatter = (value: number) => string;
export type ChartPoint = { label: string; value: number };

export const FONT_SIZE = 14;
export const TEXT_COLOR = "#292829";
export const MUTED_COLOR = "#5c5c5c";
export const ACCENT = "#f5791a";
export const ACCENT_DARK = "#be4610";
export const SELECTED_BORDER = "#077432";

// Linhas de grade e eixos: um passo acima do fundo branco, sem disputar com o dado.
export const GRID_COLOR = "#efefef";
export const AXIS_COLOR = "#dcdbdc";
const COMPACT_WIDTH = 560;

export const isCompactChart = (width: number): boolean => width < COMPACT_WIDTH;

// Um balão só para todos os painéis. "click" junto do "mousemove": no toque, o
// tap abre o balão (sem mouse, não há mousemove).
export const TOOLTIP_BASE = {
  confine: true,
  triggerOn: "mousemove|click",
  transitionDuration: 0.15,
  backgroundColor: "#ffffff",
  borderColor: GRID_COLOR,
  borderWidth: 1,
  borderRadius: 8,
  padding: [8, 12],
  extraCssText: "box-shadow: 0 4px 16px rgba(41, 40, 41, 0.12);",
  textStyle: { fontSize: FONT_SIZE, color: TEXT_COLOR },
};

export const baseOption = (): ChartOption => ({
  aria: { enabled: true },
  textStyle: { fontSize: FONT_SIZE, color: TEXT_COLOR },
  tooltip: TOOLTIP_BASE,
});

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char]);

/**
 * Conteúdo dos balões com formatter próprio: rótulo discreto em cima, valor em
 * negrito e linhas de apoio em cinza. Todo texto passa por escapeHtml.
 *
 * @example tooltipHtml("2021", "R$ 1,24 Tri", ["+8,2% em relação a 2020"])
 */
export const tooltipHtml = (
  label: string,
  value: string,
  notes: string[] = [],
): string =>
  [
    `<div style="font-size:13px;color:${MUTED_COLOR}">${escapeHtml(label)}</div>`,
    `<div style="font-size:15px;font-weight:700;color:${TEXT_COLOR}">${escapeHtml(value)}</div>`,
    ...notes.map(
      (note) =>
        `<div style="font-size:13px;color:${MUTED_COLOR}">${escapeHtml(note)}</div>`,
    ),
  ].join("");
