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
