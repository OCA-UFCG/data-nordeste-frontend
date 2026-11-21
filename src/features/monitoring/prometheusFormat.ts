import type {
  BoletimStatus,
  CheckStatus,
  MetricsReport,
} from "./metricsChecker";

type Dependency = [name: string, status: CheckStatus];

function escapeLabel(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function gauge(name: string, help: string, samples: string[]): string[] {
  return [`# HELP ${name} ${help}`, `# TYPE ${name} gauge`, ...samples];
}

const dependencyLabel = (name: string) => `dependency="${escapeLabel(name)}"`;

const dependencyUp = ([name, status]: Dependency) =>
  `datane_dependency_up{${dependencyLabel(name)}} ${Number(status.ok)}`;

const dependencyError = ([name, status]: Dependency) =>
  `datane_dependency_error{${dependencyLabel(name)},error="${escapeLabel(status.error ?? "failed")}"} 1`;

const dependencyLatency = ([name, status]: Dependency) =>
  `datane_dependency_latency_seconds{${dependencyLabel(name)}} ${status.latencyMs / 1000}`;

function formatDependencies(dependencies: Dependency[]): string[] {
  const failed = dependencies.filter(([, status]) => !status.ok);

  return [
    ...gauge(
      "datane_dependency_up",
      "1 se a dependência respondeu na última verificação.",
      dependencies.map(dependencyUp),
    ),
    ...gauge(
      "datane_dependency_error",
      "Categoria da falha da dependência; só existe enquanto ela falha.",
      failed.map(dependencyError),
    ),
    ...gauge(
      "datane_dependency_latency_seconds",
      "Quanto a dependência levou para responder na última verificação.",
      dependencies.map(dependencyLatency),
    ),
  ];
}

const boletimId = (boletim: BoletimStatus) => `id="${escapeLabel(boletim.id)}"`;

const boletimUp = (boletim: BoletimStatus) =>
  `datane_boletim_up{${boletimId(boletim)},titulo="${escapeLabel(boletim.title)}"} ${Number(boletim.ok)}`;

const boletimError = (boletim: BoletimStatus) =>
  `datane_boletim_error{${boletimId(boletim)},error="${escapeLabel(boletim.error ?? "failed")}"} 1`;

function formatBoletins(boletins: BoletimStatus[]): string[] {
  return [
    ...gauge(
      "datane_boletim_up",
      "1 se o link do boletim abre como PDF pelas regras do /api/pdf-proxy.",
      boletins.map(boletimUp),
    ),
    ...gauge(
      "datane_boletim_error",
      "Por que o boletim não abre; só existe enquanto ele falha.",
      boletins.filter((boletim) => !boletim.ok).map(boletimError),
    ),
  ];
}

// IMPORTANT: as séries `_up` têm rótulos fixos. O motivo da falha vai nas
// métricas `_error`: um rótulo variável em `_up` troca a série a cada motivo, e
// um alerta com `for` recomeça a contar.
/**
 * The report in the Prometheus text format.
 *
 * Usage: formatMetrics({ dependencies: {}, boletins: [] }) => "# HELP datane_dependency_up ..."
 */
export function formatMetrics({
  dependencies,
  boletins,
}: MetricsReport): string {
  const lines = [
    ...formatDependencies(Object.entries(dependencies)),
    ...formatBoletins(boletins),
  ];

  return lines.join("\n") + "\n";
}
