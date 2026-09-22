import { afterEach, describe, expect, it, vi } from "vitest";
import { findAvailableAutomaticReport } from "./reportGateway";

const API_URL = "http://automatic-report.test";

const DEFAULT_INDEX = [
  {
    arquivo_pdf: "relatorio_saude__maragogi.pdf",
    cidade: "Maragogi",
    macrotema: "Saúde",
    pdf_url: "/output/relatorio_saude__maragogi.pdf",
    last_modified_utc: "2026-08-12T17:48:08.000Z",
  },
];

class AutomaticReportIndexFetchFake {
  constructor(private readonly index: object[] = DEFAULT_INDEX) {}

  readonly fetch = vi.fn(
    async (): Promise<Response> => Response.json(this.index),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("automatic report city matching", () => {
  it("finds a backend report without a state suffix", async () => {
    const reportIndex = new AutomaticReportIndexFetchFake();
    vi.stubGlobal("fetch", reportIndex.fetch);
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", API_URL);

    const report = await findAvailableAutomaticReport(
      new URLSearchParams({ city: "Maragogi (AL)", macrotema: "saude" }),
    );

    expect(report).toEqual({
      fileName: "relatorio_saude__maragogi.pdf",
      pdfUrl: `${API_URL}/output/relatorio_saude__maragogi.pdf`,
    });
  });
});

describe("automatic report lookup by file name", () => {
  const params = new URLSearchParams({
    city: "Maragogi (AL)",
    macrotema: "saude",
  });

  it("resolves the named artifact whatever its age", async () => {
    // O gate de frescor do backend já decidiu que este artefato vale; comparar o
    // mtime dele com o instante do clique só reprovaria um HIT legítimo.
    const reportIndex = new AutomaticReportIndexFetchFake();
    vi.stubGlobal("fetch", reportIndex.fetch);
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", API_URL);

    const report = await findAvailableAutomaticReport(
      params,
      "relatorio_saude__maragogi.pdf",
    );

    expect(report).toEqual({
      fileName: "relatorio_saude__maragogi.pdf",
      pdfUrl: `${API_URL}/output/relatorio_saude__maragogi.pdf`,
    });
  });

  it("returns null when the index does not list the artifact", async () => {
    const reportIndex = new AutomaticReportIndexFetchFake();
    vi.stubGlobal("fetch", reportIndex.fetch);
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", API_URL);

    const report = await findAvailableAutomaticReport(
      params,
      "relatorio_saude__maragogi_pb.pdf",
    );

    expect(report).toBeNull();
  });
});

describe("automatic report version matching", () => {
  const RECIFE_INDEX = [
    {
      arquivo_pdf: "relatorio_demografia__recife_pe_.pdf",
      cidade: "Recife (PE)",
      macrotema: "Demografia",
      pdf_url: "/output/v111/relatorio_demografia__recife_pe_.pdf",
      last_modified_utc: "2026-08-12T17:48:08.000Z",
    },
  ];
  const params = new URLSearchParams({
    city: "Recife (PE)",
    macrotema: "demografia",
  });

  it("aceita um artefato mais velho que o clique quando o nome casa (regressão P1)", async () => {
    const reportIndex = new AutomaticReportIndexFetchFake(RECIFE_INDEX);
    vi.stubGlobal("fetch", reportIndex.fetch);
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", API_URL);

    const report = await findAvailableAutomaticReport(
      params,
      "relatorio_demografia__recife_pe_.pdf",
    );

    expect(report?.fileName).toBe("relatorio_demografia__recife_pe_.pdf");
  });

  it("rejeita o artefato enquanto a versão for a marcada como obsoleta", async () => {
    const reportIndex = new AutomaticReportIndexFetchFake(RECIFE_INDEX);
    vi.stubGlobal("fetch", reportIndex.fetch);
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", API_URL);

    const report = await findAvailableAutomaticReport(
      params,
      "relatorio_demografia__recife_pe_.pdf",
      "111",
    );

    expect(report).toBeNull();
  });

  it("aceita quando a versão muda", async () => {
    const reportIndex = new AutomaticReportIndexFetchFake([
      {
        ...RECIFE_INDEX[0],
        pdf_url: "/output/v222/relatorio_demografia__recife_pe_.pdf",
      },
    ]);
    vi.stubGlobal("fetch", reportIndex.fetch);
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", API_URL);

    const report = await findAvailableAutomaticReport(
      params,
      "relatorio_demografia__recife_pe_.pdf",
      "111",
    );

    expect(report?.fileName).toBe("relatorio_demografia__recife_pe_.pdf");
  });
});
