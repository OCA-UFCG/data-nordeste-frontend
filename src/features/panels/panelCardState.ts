/**
 * Estado visual de um card de painel.
 *
 * - `ok`: dado atual.
 * - `stale`: dado anterior esmaecido enquanto o filtro pedido chega.
 * - `loading`: esqueleto, sem dado anterior para mostrar.
 * - `error`: a consulta falhou; o card mostra "Tentar de novo".
 */
export type PanelCardState = "ok" | "stale" | "loading" | "error";

export type PanelLoadStatus = { failed: boolean; loading: boolean };

/**
 * Estado de um card sem filtro pendente: carregando vence erro, e erro vence ok.
 * `stale` não sai daqui, porque depende do filtro pedido, não do carregamento.
 *
 * @example resolvePanelCardState({ failed: true, loading: false }) // "error"
 */
export const resolvePanelCardState = ({
  failed,
  loading,
}: PanelLoadStatus): Exclude<PanelCardState, "stale"> => {
  // Recarregar vence o erro: sem essa prioridade o "Tentar de novo" nunca
  // mostraria o esqueleto nem desabilitaria o botão (revisões das PRs #397 e #401).
  if (loading) return "loading";
  if (failed) return "error";

  return "ok";
};

export type PanelLoadRequest<Filters> = {
  failed: boolean;
  retrying: boolean;

  // Filtros pedidos enquanto a navegação está pendente; null fora dela.
  pending: Filters | null;
};

// Listas (UFs, municípios) comparam pelo conteúdo: o filtro pedido é sempre
// um objeto novo, e `!==` entre arrays acusaria mudança em todo filtro.
const sameFilterValue = (left: unknown, right: unknown): boolean =>
  String(left) === String(right);

const resolveDependentCardState = <Filters>(
  { failed, retrying, pending }: PanelLoadRequest<Filters>,
  current: Filters,
  dependsOn: readonly (keyof Filters)[],
): PanelCardState => {
  // Recarregar vence o erro: sem essa prioridade o "Tentar de novo" nunca
  // mostraria o esqueleto nem desabilitaria o botão (revisão da PR #397).
  if (failed) {
    return resolvePanelCardState({
      failed,
      loading: retrying || pending !== null,
    });
  }
  if (!pending) return "ok";

  return dependsOn.some((key) => !sameFilterValue(pending[key], current[key]))
    ? "stale"
    : "ok";
};

/**
 * Estado de cada card enquanto um filtro carrega: só esmaece (`stale`) o card
 * cujo dado depende de um filtro que mudou; os outros ficam `ok`, sem
 * esqueleto, e o painel não "recarrega" inteiro. Com a consulta anterior
 * falhada, vale `resolvePanelCardState` (carregando vence erro).
 *
 * @example resolveDependentCardStates({ failed: false, retrying: false, pending: { ...filters, uf: ["PE"] } }, filters, { map: ["ano"] }).map // "ok"
 */
export const resolveDependentCardStates = <Filters, Card extends string>(
  status: PanelLoadRequest<Filters>,
  current: Filters,
  dependencies: Record<Card, readonly (keyof Filters)[]>,
): Record<Card, PanelCardState> => {
  const cards = Object.keys(dependencies) as Card[];

  return Object.fromEntries(
    cards.map((card) => [
      card,
      resolveDependentCardState(status, current, dependencies[card]),
    ]),
  ) as Record<Card, PanelCardState>;
};
