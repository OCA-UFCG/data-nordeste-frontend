// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  createMetricsChecker,
  type MetricsCheckerDeps,
  type MetricsLogEntry,
} from "./metricsChecker";

const OPEN_LINK = "https://www.gov.br/sudene/ok.pdf/@@display-file/file";
const BROKEN_LINK = "https://www.gov.br/sudene/sem-sufixo.pdf";
const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;

class ManualClock {
  private current = 0;

  readonly now = () => this.current;

  advance(ms: number) {
    this.current += ms;
  }
}

/** Gives every check a deadline that only passes when the test says so. */
class DeadlineFake {
  readonly deadlines: { ms: number; controller: AbortController }[] = [];

  readonly signalFor = (ms: number): AbortSignal => {
    const controller = new AbortController();
    this.deadlines.push({ ms, controller });

    return controller.signal;
  };

  expire(signal: AbortSignal) {
    const deadline = this.deadlines.find((d) => d.controller.signal === signal);
    deadline?.controller.abort(new DOMException("deadline", "TimeoutError"));
  }

  countOf(ms: number): number {
    return this.deadlines.filter((deadline) => deadline.ms === ms).length;
  }
}

class ContentfulPingFake {
  failure: Error | null = null;

  readonly ping = vi.fn<(signal: AbortSignal) => Promise<unknown>>(async () => {
    if (this.failure) throw this.failure;

    return {};
  });
}

class ZenodoPingFake {
  status = 200;

  readonly ping = vi.fn<(signal: AbortSignal) => Promise<number>>(
    async () => this.status,
  );
}

/** The boletim list: answers, fails, or hangs until its signal aborts. */
class BoletimListFake {
  items: unknown = [
    { sys: { id: "abre" }, title: 'Boletim "Água"', link: OPEN_LINK },
    { sys: { id: "quebrado" }, title: "Sem sufixo", link: BROKEN_LINK },
  ];
  failure: Error | null = null;
  hangsUntilAborted = false;

  readonly get = vi.fn(async (signal: AbortSignal) => {
    if (this.hangsUntilAborted) {
      await new Promise<never>((_, reject) =>
        signal.addEventListener("abort", () => reject(signal.reason)),
      );
    }
    if (this.failure) throw this.failure;

    return this.items as unknown[];
  });
}

/** Opens or refuses each link, and counts how many checks overlap. */
class PdfCheckFake {
  readonly reasons = new Map<string, string>([[BROKEN_LINK, "not_a_pdf"]]);
  running = 0;
  peak = 0;

  readonly check = vi.fn<
    (link: string, signal: AbortSignal) => Promise<string | null>
  >(async (link) => {
    this.running++;
    this.peak = Math.max(this.peak, this.running);
    await new Promise((resolve) => setTimeout(resolve, 0));
    this.running--;

    return this.reasons.get(link) ?? null;
  });
}

class LogFake {
  readonly entries: MetricsLogEntry[] = [];

  readonly log = (_level: string, entry: MetricsLogEntry) => {
    this.entries.push(entry);
  };

  events(): string[] {
    return this.entries.map((entry) => entry.event);
  }
}

function setUp(overrides: Partial<MetricsCheckerDeps> = {}) {
  const clock = new ManualClock();
  const deadlines = new DeadlineFake();
  const contentful = new ContentfulPingFake();
  const zenodo = new ZenodoPingFake();
  const list = new BoletimListFake();
  const pdf = new PdfCheckFake();
  const logs = new LogFake();
  const { getMetricsReport } = createMetricsChecker({
    pingContentful: contentful.ping,
    pingZenodo: zenodo.ping,
    getBoletimLinks: list.get,
    checkBoletimPdf: pdf.check,
    runsExternalChecks: () => true,
    boletimListLimit: 200,
    now: clock.now,
    timeoutSignal: deadlines.signalFor,
    log: logs.log,
    ...overrides,
  });

  return {
    getMetricsReport,
    clock,
    deadlines,
    contentful,
    zenodo,
    list,
    pdf,
    logs,
  };
}

describe("createMetricsChecker", () => {
  it("reports each dependency and each boletim", async () => {
    const { getMetricsReport } = setUp();

    const report = await getMetricsReport();

    expect(report.dependencies).toMatchObject({
      contentful: { ok: true },
      zenodo: { ok: true },
      lista_de_boletins: { ok: true },
    });
    expect(report.boletins).toMatchObject([
      { id: "abre", title: 'Boletim "Água"', ok: true },
      { id: "quebrado", title: "Sem sufixo", ok: false, error: "not_a_pdf" },
    ]);
  });

  it("runs no external check where they are off (failover)", async () => {
    const world = setUp({ runsExternalChecks: () => false });

    const report = await world.getMetricsReport();

    expect(report).toEqual({ dependencies: {}, boletins: [] });
    expect(world.contentful.ping).not.toHaveBeenCalled();
    expect(world.zenodo.ping).not.toHaveBeenCalled();
    expect(world.list.get).not.toHaveBeenCalled();
    expect(world.pdf.check).not.toHaveBeenCalled();
  });

  it("gives each check its deadline", async () => {
    const { getMetricsReport, deadlines } = setUp();

    await getMetricsReport();

    // Contentful, Zenodo e a lista: 8 s. Os dois boletins: 20 s.
    expect(deadlines.countOf(8 * SECOND_MS)).toBe(3);
    expect(deadlines.countOf(20 * SECOND_MS)).toBe(2);
  });

  it("shares one verification between simultaneous requests, and reuses it for 30 s", async () => {
    const { getMetricsReport, clock, zenodo } = setUp();
    zenodo.status = 500;

    await Promise.all([getMetricsReport(), getMetricsReport()]);
    clock.advance(29 * SECOND_MS);
    await getMetricsReport();
    expect(zenodo.ping).toHaveBeenCalledTimes(1);

    clock.advance(2 * SECOND_MS);
    await getMetricsReport();
    expect(zenodo.ping).toHaveBeenCalledTimes(2);
  });
});

describe("createMetricsChecker, failure categories", () => {
  it("names the category of each failure, never the raw message", async () => {
    const { getMetricsReport, contentful, zenodo, pdf } = setUp();
    contentful.failure = new Error("secret detail from the server");
    zenodo.status = 503;
    pdf.reasons.set(OPEN_LINK, "HTTP 404");

    const report = await getMetricsReport();

    expect(report.dependencies.contentful.error).toBe("failed");
    expect(report.dependencies.zenodo.error).toBe("HTTP 503");
    expect(report.boletins.map((boletim) => boletim.error)).toEqual([
      "HTTP 404",
      "not_a_pdf",
    ]);
  });

  it("says timeout when a check runs out of time", async () => {
    const { getMetricsReport, contentful } = setUp();
    contentful.failure = new DOMException("deadline", "TimeoutError");

    const report = await getMetricsReport();

    expect(report.dependencies.contentful.error).toBe("timeout");
  });

  it("fails a boletim that has no link", async () => {
    const { getMetricsReport, list, pdf } = setUp();
    list.items = [{ sys: { id: "sem-link" }, title: "Sem link" }];

    const report = await getMetricsReport();

    expect(report.boletins).toMatchObject([
      { id: "sem-link", error: "sem_link" },
    ]);
    expect(pdf.check).not.toHaveBeenCalled();
  });
});

describe("createMetricsChecker, Contentful quota", () => {
  it("remembers a working Contentful for 1 h", async () => {
    const { getMetricsReport, clock, contentful } = setUp();

    await getMetricsReport();
    clock.advance(59 * MINUTE_MS);
    await getMetricsReport();
    expect(contentful.ping).toHaveBeenCalledTimes(1);

    clock.advance(2 * MINUTE_MS);
    await getMetricsReport();
    expect(contentful.ping).toHaveBeenCalledTimes(2);
  });

  it("remembers a failing Contentful for only 10 min, not 1 h", async () => {
    const { getMetricsReport, clock, contentful } = setUp();
    contentful.failure = new Error("HTTP 503");

    await getMetricsReport();
    clock.advance(MINUTE_MS);
    await getMetricsReport();
    expect(contentful.ping).toHaveBeenCalledTimes(1);

    clock.advance(10 * MINUTE_MS);
    await getMetricsReport();
    expect(contentful.ping).toHaveBeenCalledTimes(2);
  });

  it("asks Zenodo again at once after a failure, and waits 15 min after a success", async () => {
    const { getMetricsReport, clock, zenodo } = setUp();
    zenodo.status = 500;
    await getMetricsReport();
    clock.advance(MINUTE_MS);
    await getMetricsReport();
    expect(zenodo.ping).toHaveBeenCalledTimes(2);

    zenodo.status = 200;
    clock.advance(MINUTE_MS);
    await getMetricsReport();
    clock.advance(14 * MINUTE_MS);
    await getMetricsReport();
    expect(zenodo.ping).toHaveBeenCalledTimes(3);
  });
});

describe("createMetricsChecker, boletim list", () => {
  it("brings the boletins back once the list recovers, not 15 min later", async () => {
    const { getMetricsReport, clock, list } = setUp();
    list.failure = new Error("HTTP 503");

    const down = await getMetricsReport();
    expect(down.dependencies.lista_de_boletins).toMatchObject({
      ok: false,
      error: "failed",
    });
    expect(down.boletins).toEqual([]);

    // Past the 5 min the failure is kept, well before the 15 min of a success.
    list.failure = null;
    clock.advance(6 * MINUTE_MS);

    expect((await getMetricsReport()).boletins).toHaveLength(2);
  });

  it("does not ask Contentful again every minute while the list keeps failing", async () => {
    const { getMetricsReport, clock, list } = setUp();
    list.failure = new Error("HTTP 429");

    await getMetricsReport();
    clock.advance(MINUTE_MS);
    await getMetricsReport();

    expect(list.get).toHaveBeenCalledTimes(1);
  });

  it("does not fetch the list again while the boletins are still remembered", async () => {
    const { getMetricsReport, clock, list } = setUp();

    await getMetricsReport();
    clock.advance(MINUTE_MS);
    await getMetricsReport();

    expect(list.get).toHaveBeenCalledTimes(1);
  });

  it("gives up on a list that hangs and reports a timeout", async () => {
    const { getMetricsReport, deadlines, list } = setUp();
    list.hangsUntilAborted = true;

    const pending = getMetricsReport();
    await vi.waitFor(() => expect(list.get).toHaveBeenCalled());
    deadlines.expire(list.get.mock.calls[0][0]);
    const report = await pending;

    expect(report.dependencies.lista_de_boletins).toMatchObject({
      ok: false,
      error: "timeout",
    });
  });

  it("fails the list, instead of crashing, when Contentful answers something that is not a list", async () => {
    const { getMetricsReport, list } = setUp();
    list.items = null;

    const report = await getMetricsReport();

    expect(report.dependencies.lista_de_boletins).toMatchObject({
      ok: false,
      error: "lista_invalida",
    });
    expect(report.boletins).toEqual([]);
  });
});

describe("createMetricsChecker, bad and many items", () => {
  it("drops the items it cannot read and logs it, instead of failing the report", async () => {
    const { getMetricsReport, list, logs } = setUp();
    list.items = [
      null,
      { sys: null },
      { title: "sem sys" },
      { sys: { id: "" } },
      { sys: { id: "bom" }, title: 7, link: OPEN_LINK },
    ];

    const report = await getMetricsReport();

    expect(report.boletins).toMatchObject([{ id: "bom", title: "", ok: true }]);
    expect(logs.entries).toContainEqual({
      event: "metrics_boletim_items_invalid",
      count: 4,
    });
  });

  it("logs when the list is as long as its limit, since it may be cut", async () => {
    const { getMetricsReport, logs } = setUp({ boletimListLimit: 2 });

    await getMetricsReport();

    expect(logs.entries).toContainEqual({
      event: "metrics_boletim_list_truncated",
      limit: 2,
    });
  });

  it("stays quiet about the limit while the list is shorter", async () => {
    const { getMetricsReport, logs } = setUp({ boletimListLimit: 3 });

    await getMetricsReport();

    expect(logs.events()).not.toContain("metrics_boletim_list_truncated");
  });

  it("checks no more than 10 boletins at once, and checks them all", async () => {
    const { getMetricsReport, list, pdf } = setUp();
    list.items = Array.from({ length: 20 }, (_, index) => ({
      sys: { id: `b${index}` },
      title: `Boletim ${index}`,
      link: OPEN_LINK,
    }));

    const report = await getMetricsReport();

    expect(report.boletins).toHaveLength(20);
    expect(pdf.peak).toBe(10);
  });
});

describe("createMetricsChecker, log", () => {
  it("logs a change of state once, not on every collection", async () => {
    const { getMetricsReport, clock, contentful, logs } = setUp();
    contentful.failure = new Error("HTTP 503");
    const contentfulEvents = () =>
      logs.entries.filter((entry) => entry.check === "contentful");

    await getMetricsReport();
    clock.advance(11 * MINUTE_MS);
    await getMetricsReport();
    expect(contentfulEvents().map((e) => e.event)).toEqual([
      "metrics_check_failed",
    ]);

    contentful.failure = null;
    clock.advance(11 * MINUTE_MS);
    await getMetricsReport();
    expect(contentfulEvents().map((e) => e.event)).toEqual([
      "metrics_check_failed",
      "metrics_check_recovered",
    ]);
  });

  it("logs nothing for checks that have always worked", async () => {
    const { getMetricsReport, logs, pdf } = setUp();
    pdf.reasons.clear();

    await getMetricsReport();

    expect(logs.events()).toEqual([]);
  });
});
