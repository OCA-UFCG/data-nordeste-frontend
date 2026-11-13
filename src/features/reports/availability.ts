// INTENTIONAL: o relatório personalizado fica fora de prod até os relatórios serem
// considerados prontos. Antes ele saía de prod por uma linha à parte
// (hotfix/prod-contentful, f6da15d), e uma tag cortada do main o trazia de volta.
// Para liberar em prod, esta função passa a devolver true; nada mais muda.
// Lê o env a cada chamada e pelo nome literal: o Next só embute no bundle do
// browser (Header) `process.env.NEXT_PUBLIC_*` escrito assim.

/**
 * Whether /relatorio, its nav link and /api/reports/* are served in this build.
 *
 * Usage: if (!isReportFeatureEnabled()) notFound();
 */
export function isReportFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV !== "prod";
}
