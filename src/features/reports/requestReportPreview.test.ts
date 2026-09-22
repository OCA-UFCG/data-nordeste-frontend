import { afterEach, describe, expect, it, vi } from "vitest";
import { requestReportPreview } from "./requestReportPreview";

const REQUEST = { city: "Recife (PE)", macrotheme: "saude" };
const READY = {
  status: "ready",
  fileName: "relatorio_recife_pe.pdf",
  url: "/api/reports/download?city=Recife%20(PE)&arquivo=relatorio_saude__recife.pdf",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("automatic report preview request", () => {
  it("uses the report the POST already resolved", async () => {
    // The backend generates synchronously, so a POST answering "ready" means the
    // artifact exists now. Polling after that is what hung on a cache HIT: the
    // PDF is served without being rewritten, so it never looks newer than the
    // click and every status check answered 202 until the attempts ran out.
    const methods: (string | undefined)[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        methods.push(init?.method);

        return Response.json(READY);
      }),
    );

    const preview = await requestReportPreview(REQUEST);

    expect(preview).toEqual({ fileName: READY.fileName, url: READY.url });
    expect(methods).toEqual(["POST"]);
  });

  it("polls using the artifact identity the POST response carried", async () => {
    // The client stops stamping its own clock: once the backend names the
    // artifact (even mid-processing), the poll asks for that exact name and
    // version instead of a fresh city+macrotheme lookup.
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        urls.push(url);
        if (init?.method === "POST") {
          return Response.json(
            {
              status: "processing",
              arquivo: "relatorio_saude__recife.pdf",
              versao: "111",
            },
            { status: 202 },
          );
        }

        return Response.json(READY);
      }),
    );

    const preview = await requestReportPreview(REQUEST);

    expect(preview).toEqual({ fileName: READY.fileName, url: READY.url });
    expect(urls[1]).toContain("arquivo=relatorio_saude__recife.pdf");
    expect(urls[1]).toContain("versao_obsoleta=111");
  });

  it("falls back to polling while the POST answers processing", async () => {
    vi.useFakeTimers();
    const methods: (string | undefined)[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        methods.push(init?.method);
        if (init?.method === "POST") {
          return NextProcessing();
        }

        return methods.length < 3 ? NextProcessing() : Response.json(READY);
      }),
    );

    const pending = requestReportPreview(REQUEST);
    await vi.advanceTimersByTimeAsync(5000);

    await expect(pending).resolves.toEqual({
      fileName: READY.fileName,
      url: READY.url,
    });
    expect(methods).toEqual(["POST", undefined, undefined]);
  });
});

function NextProcessing(): Response {
  return Response.json({ status: "processing" }, { status: 202 });
}
