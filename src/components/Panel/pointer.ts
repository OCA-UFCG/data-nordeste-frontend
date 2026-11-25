import type { PointerEvent } from "react";

export type PreviewHandler = (label: string | null) => void;

/**
 * Handler de ponteiro que só repassa `value` quando o ponteiro é o mouse.
 * WHY: no toque, o pointerenter/leave vem junto do toque, e o toque já tem o
 * próprio gesto (o clique fixa a seleção ou alterna o destaque).
 *
 * @example <li onPointerEnter={previewOnMouse(onPreview, point.label)} />
 */
export const previewOnMouse =
  <Value>(onPreview: ((value: Value) => void) | undefined, value: Value) =>
  (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") onPreview?.(value);
  };
