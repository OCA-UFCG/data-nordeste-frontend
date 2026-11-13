import { timingSafeEqual } from "node:crypto";
import {
  getMetricsReport,
  type BoletimStatus,
  type CheckStatus,
  type MetricsReport,
} from "./checks";

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

function escapeLabel(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function errorLabel(status: CheckStatus): string {
  return status.error ? `,error="${escapeLabel(status.error)}"` : "";
}

function formatDependencies(dependencies: [string, CheckStatus][]): string[] {
  return [
    "# HELP datane_dependency_up 1 se a dependência respondeu na última verificação; o rótulo error diz a categoria da falha.",
    "# TYPE datane_dependency_up gauge",
    ...dependencies.map(
      ([name, status]) =>
        `datane_dependency_up{dependency="${name}"${errorLabel(status)}} ${Number(status.ok)}`,
    ),
    "# HELP datane_dependency_latency_seconds Quanto a dependência levou para responder na última verificação.",
    "# TYPE datane_dependency_latency_seconds gauge",
    ...dependencies.map(
      ([name, status]) =>
        `datane_dependency_latency_seconds{dependency="${name}"} ${status.latencyMs / 1000}`,
    ),
  ];
}

function formatBoletins(boletins: BoletimStatus[]): string[] {
  return [
    "# HELP datane_boletim_up 1 se o link do boletim abre como PDF pelas regras do /api/pdf-proxy; o rótulo error diz por que não abre.",
    "# TYPE datane_boletim_up gauge",
    ...boletins.map(
      (boletim) =>
        `datane_boletim_up{id="${escapeLabel(boletim.id)}",titulo="${escapeLabel(boletim.title)}"${errorLabel(boletim)}} ${Number(boletim.ok)}`,
    ),
  ];
}

function formatMetrics({ dependencies, boletins }: MetricsReport): string {
  const lines = [
    ...formatDependencies(Object.entries(dependencies)),
    ...formatBoletins(boletins),
  ];

  return lines.join("\n") + "\n";
}
