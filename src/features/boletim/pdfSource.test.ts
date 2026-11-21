import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkBoletimPdf,
  fetchThroughAllowedHosts,
  hasPdfSignature,
  openAllowedPdf,
  parseAllowedPdfUrl,
} from "./pdfSource";

const BOLETIM_URL = "https://www.gov.br/sudene/boletim.pdf/@@display-file/file";
const DRIVE_URL = "https://drive.google.com/uc?export=download&id=abc";
const DRIVE_TARGET =
  "https://drive.usercontent.google.com/download?id=abc&export=download";
const FORBIDDEN_TARGET = "http://169.254.169.254/latest/meta-data/";

/** A body that records being cancelled; after its chunks it stays open, like a download still running. */
class TrackedBody {
  cancelled = false;
  readonly stream: ReadableStream<Uint8Array>;

  constructor(chunks: string[] = []) {
    const queue = chunks.map((chunk) => new TextEncoder().encode(chunk));
    this.stream = new ReadableStream<Uint8Array>({
      pull: (controller) => {
        const next = queue.shift();
        if (next) controller.enqueue(next);
      },
      cancel: () => {
        this.cancelled = true;
      },
    });
  }
}

/** A body whose connection already dropped: cancelling it rejects. */
const brokenBody = () =>
  new ReadableStream<Uint8Array>({
    start: (controller) => controller.error(new TypeError("terminated")),
  });

const redirectTo = (location: string, body?: TrackedBody) =>
  new Response(body?.stream ?? null, {
    status: 303,
    headers: { Location: location },
  });

/** Answers each fetch with the next scripted response, in order. */
class BoletimHostFetchFake {
  constructor(private readonly responses: Response[]) {}

  readonly fetch = vi.fn<(url: URL, init?: RequestInit) => Promise<Response>>(
    async () => {
      const next = this.responses.shift();
      if (!next) throw new Error("BoletimHostFetchFake: no scripted response");

      return next;
    },
  );
}

const useBoletimHost = (responses: Response[]) => {
  const boletimHost = new BoletimHostFetchFake(responses);
  vi.stubGlobal("fetch", boletimHost.fetch);

  return boletimHost;
};

afterEach(() => vi.unstubAllGlobals());

describe("parseAllowedPdfUrl", () => {
  it.each([
    [
      "a boletim PDF on www.gov.br",
      "https://www.gov.br/sudene/pt-br/assuntos/boletins-tematicos/arquivos/boletim.pdf/@@display-file/file",
    ],
    [
      "the Google Drive download link",
      "https://drive.google.com/uc?export=download&id=abc",
    ],
    [
      "the Google Drive download redirect target",
      "https://drive.usercontent.google.com/download?id=abc&export=download",
    ],
  ])("accepts %s", (_case, rawUrl) => {
    expect(parseAllowedPdfUrl(rawUrl)).not.toBeNull();
  });

  it.each([
    [
      "a link-local metadata address",
      "http://169.254.169.254/latest/meta-data/",
    ],
    ["plain http on the allowed host", "http://www.gov.br/sudene/boletim.pdf"],
    ["a lookalike host", "https://www.gov.br.evil.example/boletim.pdf"],
    ["credentials pointing elsewhere", "https://www.gov.br@evil.example/x.pdf"],
    ["an internal service", "http://internal-service:8000/"],
    ["something that is not a URL", "not a url"],
  ])("rejects %s", (_case, rawUrl) => {
    expect(parseAllowedPdfUrl(rawUrl)).toBeNull();
  });
});

describe("hasPdfSignature", () => {
  const encode = (text: string) => new TextEncoder().encode(text);

  it("recognizes a PDF by its first bytes", () => {
    expect(hasPdfSignature(encode("%PDF-1.7\n..."))).toBe(true);
  });

  it.each([
    ["an HTML page", "<!doctype html><html>"],
    ["an empty body", ""],
  ])("rejects %s", (_case, body) => {
    expect(hasPdfSignature(encode(body))).toBe(false);
  });
});

describe("fetchThroughAllowedHosts", () => {
  it("follows a redirect that stays on allowed hosts, passing the signal on", async () => {
    const signal = new AbortController().signal;
    const boletimHost = useBoletimHost([
      redirectTo(DRIVE_TARGET),
      new Response("%PDF-1.7"),
    ]);

    const fetched = await fetchThroughAllowedHosts(new URL(DRIVE_URL), signal);

    expect(fetched).toHaveProperty("response");
    expect(boletimHost.fetch.mock.calls.map(([url]) => String(url))).toEqual([
      DRIVE_URL,
      DRIVE_TARGET,
    ]);
    expect(
      boletimHost.fetch.mock.calls.every(([, i]) => i?.signal === signal),
    ).toBe(true);
  });

  it("rejects a redirect to a host outside the list, without fetching it", async () => {
    const boletimHost = useBoletimHost([redirectTo(FORBIDDEN_TARGET)]);

    const fetched = await fetchThroughAllowedHosts(new URL(BOLETIM_URL));

    expect(fetched).toEqual({ rejection: "redirect_not_allowed" });
    expect(boletimHost.fetch).toHaveBeenCalledTimes(1);
  });

  it("gives up after more than 3 redirects", async () => {
    const boletimHost = useBoletimHost(
      Array.from({ length: 5 }, () => redirectTo(DRIVE_TARGET)),
    );

    const fetched = await fetchThroughAllowedHosts(new URL(DRIVE_URL));

    expect(fetched).toEqual({ rejection: "too_many_redirects" });
    expect(boletimHost.fetch).toHaveBeenCalledTimes(4);
  });

  it("cancels the body of a redirect it follows", async () => {
    const redirectBody = new TrackedBody();
    useBoletimHost([
      redirectTo(DRIVE_TARGET, redirectBody),
      new Response("%PDF-"),
    ]);

    await fetchThroughAllowedHosts(new URL(DRIVE_URL));

    expect(redirectBody.cancelled).toBe(true);
  });

  it("still follows a redirect whose body already failed", async () => {
    useBoletimHost([
      new Response(brokenBody(), {
        status: 303,
        headers: { Location: DRIVE_TARGET },
      }),
      new Response("%PDF-"),
    ]);

    const fetched = await fetchThroughAllowedHosts(new URL(DRIVE_URL));

    expect(fetched).toHaveProperty("response");
  });

  it("still rejects a forbidden redirect whose body already failed", async () => {
    useBoletimHost([
      new Response(brokenBody(), {
        status: 303,
        headers: { Location: FORBIDDEN_TARGET },
      }),
    ]);

    expect(await fetchThroughAllowedHosts(new URL(BOLETIM_URL))).toEqual({
      rejection: "redirect_not_allowed",
    });
  });

  it("cancels the body of a redirect it rejects", async () => {
    const redirectBody = new TrackedBody();
    useBoletimHost([redirectTo(FORBIDDEN_TARGET, redirectBody)]);

    await fetchThroughAllowedHosts(new URL(BOLETIM_URL));

    expect(redirectBody.cancelled).toBe(true);
  });

  it("cancels every redirect body when it gives up", async () => {
    const bodies = Array.from({ length: 4 }, () => new TrackedBody());
    useBoletimHost(bodies.map((body) => redirectTo(DRIVE_TARGET, body)));

    await fetchThroughAllowedHosts(new URL(DRIVE_URL));

    expect(bodies.map((body) => body.cancelled)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });
});

describe("openAllowedPdf", () => {
  it("returns the response of an allowed link that answers 2xx", async () => {
    useBoletimHost([new Response("%PDF-1.7")]);

    expect(await openAllowedPdf(BOLETIM_URL)).toHaveProperty("response");
  });

  it("rejects a host outside the list without fetching", async () => {
    const boletimHost = useBoletimHost([]);

    expect(await openAllowedPdf(FORBIDDEN_TARGET)).toEqual({
      rejection: "host_not_allowed",
    });
    expect(boletimHost.fetch).not.toHaveBeenCalled();
  });

  it("reports the redirect rejection of the chain", async () => {
    useBoletimHost([redirectTo(FORBIDDEN_TARGET)]);

    expect(await openAllowedPdf(BOLETIM_URL)).toEqual({
      rejection: "redirect_not_allowed",
    });
  });

  it("reports the status of a host error whose body already failed", async () => {
    useBoletimHost([new Response(brokenBody(), { status: 503 })]);

    expect(await openAllowedPdf(BOLETIM_URL)).toEqual({
      rejection: "HTTP 503",
      upstreamStatus: 503,
    });
  });

  it("reports the status of a host error and cancels its body", async () => {
    const errorBody = new TrackedBody();
    useBoletimHost([new Response(errorBody.stream, { status: 404 })]);

    expect(await openAllowedPdf(BOLETIM_URL)).toEqual({
      rejection: "HTTP 404",
      upstreamStatus: 404,
    });
    expect(errorBody.cancelled).toBe(true);
  });
});

describe("checkBoletimPdf", () => {
  it("opens a PDF reading only its first bytes", async () => {
    const pdfBody = new TrackedBody(["%PDF-1.7 and a lot more"]);
    useBoletimHost([new Response(pdfBody.stream)]);

    expect(await checkBoletimPdf(BOLETIM_URL)).toBeNull();
    expect(pdfBody.cancelled).toBe(true);
  });

  it("recognizes a PDF whose first chunk is shorter than the signature", async () => {
    useBoletimHost([new Response(new TrackedBody(["%P", "DF-1.7"]).stream)]);

    expect(await checkBoletimPdf(BOLETIM_URL)).toBeNull();
  });

  it.each([
    ["an HTML page", new Response("<!doctype html>")],
    ["a body shorter than the signature", new Response("%PD")],
    ["an empty body", new Response(null)],
  ])("says not_a_pdf for %s", async (_case, response) => {
    useBoletimHost([response]);

    expect(await checkBoletimPdf(BOLETIM_URL)).toBe("not_a_pdf");
  });

  it("says HTTP nnn when the host answers with an error", async () => {
    useBoletimHost([new Response("down", { status: 503 })]);

    expect(await checkBoletimPdf(BOLETIM_URL)).toBe("HTTP 503");
  });

  it.each([
    ["a host outside the list", FORBIDDEN_TARGET, [], "host_not_allowed"],
    [
      "a redirect outside the list",
      BOLETIM_URL,
      [redirectTo(FORBIDDEN_TARGET)],
      "redirect_not_allowed",
    ],
  ])("rejects %s", async (_case, url, responses, reason) => {
    useBoletimHost(responses);

    expect(await checkBoletimPdf(url)).toBe(reason);
  });
});
