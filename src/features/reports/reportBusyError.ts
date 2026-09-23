/**
 * Thrown by `requestReportPreview` when the generation proxy answers 503: the
 * backend already has too many reports in flight. Typed instead of matching
 * on `error.message.includes("503")` — a city or file name containing "503"
 * would otherwise trip that branch.
 */
export class ReportBusyError extends Error {
  constructor() {
    super("O gerador de relatórios está ocupado.");
    this.name = "ReportBusyError";
  }
}
