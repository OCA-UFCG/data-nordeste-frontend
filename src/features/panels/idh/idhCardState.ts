export type IdhCardState = "ok" | "loading" | "error";

/**
 * Estado dos cards do painel. Recarregar vence o erro: o "Tentar de novo" só
 * aparece com `failed`, e sem essa prioridade o clique nunca mostraria o
 * esqueleto nem desabilitaria o botão (revisão da PR #397).
 *
 * @example resolveIdhCardState({ failed: true, loading: true }) // "loading"
 */
export const resolveIdhCardState = ({
  failed,
  loading,
}: {
  failed: boolean;
  loading: boolean;
}): IdhCardState => {
  if (loading) return "loading";

  return failed ? "error" : "ok";
};
