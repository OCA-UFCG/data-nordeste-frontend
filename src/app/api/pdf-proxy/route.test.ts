import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const BOLETIM_URL = "https://www.gov.br/sudene/boletim.pdf/@@display-file/file";
const DRIVE_URL = "https://drive.google.com/uc?export=download&id=abc";
const DRIVE_TARGET =
  "https://drive.usercontent.google.com/download?id=abc&export=download";

const pdfBody = (contentType: string) =>
  new Response("%PDF-1.7\n...", { headers: { "Content-Type": contentType } });

const redirectTo = (location: string) =>
  new Response(null, { status: 303, headers: { Location: location } });

/** Answers each fetch with the next scripted response, in order. */
class BoletimHostFetchFake {
  constructor(private readonly responses: Response[]) {}

  readonly fetch = vi.fn(async () => {
    const next = this.responses.shift();
    if (!next) throw new Error("BoletimHostFetchFake: no scripted response");

    return next;
  });
}

const proxyRequest = (url: string) =>
  new Request(`http://localhost/api/pdf-proxy?url=${encodeURIComponent(url)}`);

const useBoletimHost = (responses: Response[]) => {
  const boletimHost = new BoletimHostFetchFake(responses);
  vi.stubGlobal("fetch", boletimHost.fetch);

  return boletimHost;
};

beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));
afterEach(() => vi.unstubAllGlobals());

describe("GET /api/pdf-proxy", () => {
  it("serves an allowed PDF as a PDF, without opening CORS", async () => {
    useBoletimHost([pdfBody("application/pdf")]);

    const response = await GET(proxyRequest(BOLETIM_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("follows the Drive redirect and recognizes the PDF by its bytes", async () => {
    const drive = useBoletimHost([
      redirectTo(DRIVE_TARGET),
      pdfBody("application/octet-stream"),
    ]);

    const response = await GET(proxyRequest(DRIVE_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(drive.fetch).toHaveBeenLastCalledWith(new URL(DRIVE_TARGET), {
      redirect: "manual",
    });
  });

  it("never fetches a host outside the allow list", async () => {
    const boletimHost = useBoletimHost([]);

    const response = await GET(
      proxyRequest("http://169.254.169.254/latest/meta-data/"),
    );

    expect(response.status).toBe(403);
    expect(boletimHost.fetch).not.toHaveBeenCalled();
  });

  it("stops at a redirect that leaves the allow list", async () => {
    const boletimHost = useBoletimHost([
      redirectTo("http://169.254.169.254/latest/meta-data/"),
    ]);

    const response = await GET(proxyRequest(BOLETIM_URL));

    expect(response.status).toBe(403);
    expect(boletimHost.fetch).toHaveBeenCalledTimes(1);
  });

  it("refuses to relay HTML from an allowed host", async () => {
    useBoletimHost([new Response("<!doctype html><html>")]);

    const response = await GET(proxyRequest(BOLETIM_URL));

    expect(response.status).toBe(502);
  });
});
