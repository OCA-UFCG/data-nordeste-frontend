/**
 * De onde vem o destaque da legenda. Cada fonte é guardada à parte: tirar o
 * mouse não desfaz o destaque de uma pílula com foco, e vice-versa.
 * `hovered`: mouse em cima; `focused`: foco (teclado, ou o toque nos
 * navegadores que focam o botão tocado); `tapped`: o toque alternado (o
 * Safari não foca botões no toque).
 */
export type ChipHighlightState = {
  hovered: number | null;
  focused: number | null;
  tapped: number | null;
};

export type ChipHighlightAction =
  | { type: "hover"; index: number | null }
  | { type: "focus"; index: number }
  | { type: "blur" }
  | { type: "tap"; index: number };

export const NO_CHIP_HIGHLIGHT: ChipHighlightState = {
  hovered: null,
  focused: null,
  tapped: null,
};

// WHY o toque repetido limpa também o foco: no Chrome o mesmo toque foca e
// alterna, e o foco manteria o destaque que o usuário acabou de desligar.
function toggleTap(state: ChipHighlightState, index: number) {
  if (state.tapped === index) return { ...state, tapped: null, focused: null };

  return { ...state, tapped: index };
}

/**
 * Próximo estado do destaque da legenda. Perder o foco desfaz o foco e o
 * toque (tocar fora, nos navegadores que focam).
 * Ex.: `chipHighlightReducer(NO_CHIP_HIGHLIGHT, { type: "tap", index: 2 }).tapped` → `2`.
 */
export function chipHighlightReducer(
  state: ChipHighlightState,
  action: ChipHighlightAction,
): ChipHighlightState {
  if (action.type === "hover") return { ...state, hovered: action.index };
  if (action.type === "focus") return { ...state, focused: action.index };
  if (action.type === "blur") return { ...state, focused: null, tapped: null };

  return toggleTap(state, action.index);
}

/**
 * Pílula destacada: o mouse vence (é a prévia), depois o foco, depois o toque.
 * Ex.: `{ hovered: null, focused: 1, tapped: 0 }` → `1`.
 */
export function activeChip(state: ChipHighlightState): number | null {
  return state.hovered ?? state.focused ?? state.tapped;
}
