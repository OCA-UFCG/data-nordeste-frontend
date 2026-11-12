export type ViewBox = { x: number; y: number; width: number; height: number };

// Até 8× de zoom, como o mapa em tela cheia do protótipo.
export const MAX_MAP_ZOOM = 8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// A vista nunca sai do mapa nem fica maior que ele.
const clampViewBox = (view: ViewBox, base: ViewBox): ViewBox => {
  const width = clamp(view.width, base.width / MAX_MAP_ZOOM, base.width);
  const height = (width * base.height) / base.width;

  return {
    width,
    height,
    x: clamp(view.x, base.x, base.x + base.width - width),
    y: clamp(view.y, base.y, base.y + base.height - height),
  };
};

/**
 * Amplia (`factor` > 1) ou reduz a vista do mapa mantendo parado o ponto em
 * `focus` (fração da vista, 0 a 1: onde está o mouse; o centro por padrão).
 *
 * @example zoomViewBox(view, base, 1.5, { x: 0.5, y: 0.5 })
 */
export const zoomViewBox = (
  view: ViewBox,
  base: ViewBox,
  factor: number,
  focus = { x: 0.5, y: 0.5 },
): ViewBox => {
  const anchorX = view.x + view.width * focus.x;
  const anchorY = view.y + view.height * focus.y;
  const width = clamp(
    view.width / factor,
    base.width / MAX_MAP_ZOOM,
    base.width,
  );
  const height = (width * base.height) / base.width;

  return clampViewBox(
    {
      width,
      height,
      x: anchorX - width * focus.x,
      y: anchorY - height * focus.y,
    },
    base,
  );
};

/**
 * Arrasta a vista do mapa (`delta` nas unidades do mapa), sem sair dele.
 *
 * @example panViewBox(view, base, { x: 20, y: -10 })
 */
export const panViewBox = (
  view: ViewBox,
  base: ViewBox,
  delta: { x: number; y: number },
): ViewBox =>
  clampViewBox({ ...view, x: view.x + delta.x, y: view.y + delta.y }, base);

/** @example viewBoxAttribute({ x: 0, y: 0, width: 600, height: 754 }) // "0.00 0.00 600.00 754.00" */
export const viewBoxAttribute = ({ x, y, width, height }: ViewBox): string =>
  [x, y, width, height].map((value) => value.toFixed(2)).join(" ");
