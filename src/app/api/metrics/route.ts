import { timingSafeEqual } from "node:crypto";
import { formatMetrics } from "@/features/monitoring/prometheusFormat";
import { getMetricsReport } from "./checks";

/**
 * As métricas do Data Nordeste no formato que o Prometheus lê, para a VM de
 * monitoramento (oca-monitor, 34.200.5.32) vigiar o site de fora.
 *
 * Diz se cada dependência responde e se cada boletim ainda abre como PDF. Só
 * responde a quem manda o `METRICS_TOKEN`; sem ele configurado, a rota não existe.
 *
 * Usage: curl -H "Authorization: Bearer $METRICS_TOKEN" https://datanordeste-portal.com/api/metrics
 */
export async function GET(request: Request) {
  const token = process.env.METRICS_TOKEN?.trim();
  if (!token) return new Response(null, { status: 404 });
  if (!isAuthorized(request.headers.get("authorization"), token)) {
    return new Response(null, { status: 401 });
  }

  const body = formatMetrics(await getMetricsReport());

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// WARNING: comparação em tempo constante; um `===` deixaria descobrir o token
// medindo quanto cada tentativa demora.
function isAuthorized(header: string | null, token: string): boolean {
  const sent = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${token}`);

  return sent.length === expected.length && timingSafeEqual(sent, expected);
}
