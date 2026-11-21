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

/**
 * Opens or refuses each link, and counts how many checks overlap. With `takes`
 * set, each check lasts that long on the manual clock: it waits in `waiting`
 * until `drive` moves the clock to its due time.
 */
class PdfCheckFake {
  readonly reasons = new Map<string, string>([[BROKEN_LINK, "not_a_pdf"]]);
  running = 0;
  peak = 0;
  takes = 0;
  readonly waiting: { dueAt: number; release: () => void }[] = [];

  constructor(private readonly clock: ManualClock) {}

  readonly check = vi.fn<
    (link: string, signal: AbortSignal) => Promise<string | null>
  >(async (link) => {
    this.running++;
    this.peak = Math.max(this.peak, this.running);
    if (this.takes > 0) {
      await new Promise<void>((release) =>
        this.waiting.push({ dueAt: this.clock.now() + this.takes, release }),
      );
    } else {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
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
  const pdf = new PdfCheckFake(clock);
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

/**
 * Lets slow checks finish without waiting: whenever every started check is
 * waiting, the manual clock jumps to the earliest due time and releases the checks
 * due by then.
 */
async function drive<T>(
  pdf: PdfCheckFake,
  clock: ManualClock,
  collection: Promise<T>,
): Promise<T> {
  let finished = false;
  collection.then(
    () => (finished = true),
    () => (finished = true),
  );
  for (let step = 0; !finished; step++) {
    if (step > 10_000) throw new Error("drive: the collection never finished");
    await new Promise((resolve) => setTimeout(resolve, 0));
    const next = [...pdf.waiting].sort((a, b) => a.dueAt - b.dueAt)[0];
    if (!next) continue;
    clock.advance(Math.max(0, next.dueAt - clock.now()));
    const due = pdf.waiting.filter((check) => check.dueAt <= clock.now());
    const later = pdf.waiting.filter((check) => check.dueAt > clock.now());
    pdf.waiting.splice(0, pdf.waiting.length, ...later);
    due.forEach((check) => check.release());
  }

  return collection;
}

const manyBoletins = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    sys: { id: `b${index}` },
    title: `Boletim ${index}`,
    link: OPEN_LINK,
  }));

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

describe("createMetricsChecker, slow gov.br", () => {
  it("stays within its time budget and finishes the rest on the next collections", async () => {
    const world = setUp();
    world.list.items = manyBoletins(40);
    world.pdf.takes = 20 * SECOND_MS;
    const collect = () =>
      drive(world.pdf, world.clock, world.getMetricsReport());

    const startedAt = world.clock.now();
    const first = await collect();

    expect(world.clock.now() - startedAt).toBeLessThanOrEqual(40 * SECOND_MS);
    expect(first.boletins).toHaveLength(20);
    expect(world.logs.entries).toContainEqual({
      event: "metrics_boletins_round_partial",
      count: 20,
    });

    world.clock.advance(31 * SECOND_MS);
    const second = await collect();

    expect(second.boletins).toHaveLength(40);
    expect(world.pdf.check).toHaveBeenCalledTimes(40);
  });

  it("checks each boletim once per cycle, then starts another cycle after 15 min", async () => {
    const world = setUp();
    world.list.items = manyBoletins(40);
    world.pdf.takes = 20 * SECOND_MS;
    const collect = () =>
      drive(world.pdf, world.clock, world.getMetricsReport());

    await collect();
    world.clock.advance(31 * SECOND_MS);
    await collect();
    world.clock.advance(31 * SECOND_MS);
    const third = await collect();

    expect(third.boletins).toHaveLength(40);
    expect(world.pdf.check).toHaveBeenCalledTimes(40);

    world.clock.advance(16 * MINUTE_MS);
    await collect();

    expect(world.pdf.check).toHaveBeenCalledTimes(60);

    // O novo ciclo não acabou (só 20 de 40): a coleta seguinte continua nele.
    world.clock.advance(31 * SECOND_MS);
    await collect();

    expect(world.pdf.check).toHaveBeenCalledTimes(80);
  });

  it("does not start a check that would not fit in what is left of the budget", async () => {
    const world = setUp();
    world.list.items = manyBoletins(40);
    world.pdf.takes = 15 * SECOND_MS;

    const startedAt = world.clock.now();
    const report = await drive(
      world.pdf,
      world.clock,
      world.getMetricsReport(),
    );

    // Levas em 0 s e 15 s; a de 30 s só teria 10 s de orçamento, menos que o prazo.
    expect(report.boletins).toHaveLength(20);
    expect(world.clock.now() - startedAt).toBeLessThanOrEqual(40 * SECOND_MS);
  });

  it("never starts a check with less than its full deadline left", async () => {
    const world = setUp();
    world.list.items = manyBoletins(40);
    world.pdf.takes = 20 * SECOND_MS;
    const collect = () =>
      drive(world.pdf, world.clock, world.getMetricsReport());

    await collect();
    world.clock.advance(31 * SECOND_MS);
    await collect();

    const lengths = world.deadlines.deadlines.map((deadline) => deadline.ms);
    expect(lengths.filter((ms) => ms === 20 * SECOND_MS)).toHaveLength(40);
    expect(
      lengths.every((ms) => ms === 8 * SECOND_MS || ms === 20 * SECOND_MS),
    ).toBe(true);
  });

  it("checks a long list in one collection when gov.br answers fast", async () => {
    const world = setUp({ boletimListLimit: 1_000 });
    world.list.items = manyBoletins(200);
    world.pdf.takes = SECOND_MS;

    const startedAt = world.clock.now();
    const report = await drive(
      world.pdf,
      world.clock,
      world.getMetricsReport(),
    );

    expect(world.clock.now() - startedAt).toBeLessThanOrEqual(40 * SECOND_MS);
    expect(report.boletins).toHaveLength(200);
    expect(world.logs.events()).not.toContain("metrics_boletins_round_partial");
  });

  it("drops a boletim that left the list", async () => {
    const world = setUp();
    await world.getMetricsReport();

    world.list.items = manyBoletins(1);
    world.clock.advance(16 * MINUTE_MS);
    const report = await world.getMetricsReport();

    expect(report.boletins.map((boletim) => boletim.id)).toEqual(["b0"]);
  });
});

describe("createMetricsChecker, list failing after it worked", () => {
  it("keeps checking the last known boletins, so their series do not vanish", async () => {
    const world = setUp();
    await world.getMetricsReport();

    world.list.failure = new Error("HTTP 503");
    world.pdf.reasons.set(OPEN_LINK, "HTTP 503");
    world.clock.advance(16 * MINUTE_MS);
    const report = await world.getMetricsReport();

    expect(report.dependencies.lista_de_boletins).toMatchObject({
      ok: false,
      error: "failed",
    });
    expect(report.boletins).toMatchObject([
      { id: "abre", ok: false, error: "HTTP 503" },
      { id: "quebrado", ok: false, error: "not_a_pdf" },
    ]);
  });

  it("does not recheck the boletins on every retry of the list", async () => {
    const world = setUp();
    await world.getMetricsReport();
    world.list.failure = new Error("HTTP 503");
    world.clock.advance(16 * MINUTE_MS);
    await world.getMetricsReport();
    const checksBefore = world.pdf.check.mock.calls.length;

    world.clock.advance(6 * MINUTE_MS);
    await world.getMetricsReport();

    expect(world.list.get).toHaveBeenCalledTimes(3);
    expect(world.pdf.check.mock.calls.length).toBe(checksBefore);
  });

  it("checks a boletim that is new when the list comes back, without waiting", async () => {
    const world = setUp();
    await world.getMetricsReport();
    world.list.failure = new Error("HTTP 503");
    world.clock.advance(16 * MINUTE_MS);
    await world.getMetricsReport();
    const checksBefore = world.pdf.check.mock.calls.length;

    world.list.failure = null;
    world.list.items = [
      ...(world.list.items as unknown[]),
      { sys: { id: "novo" }, title: "Novo", link: OPEN_LINK },
    ];
    world.clock.advance(6 * MINUTE_MS);
    const report = await world.getMetricsReport();

    expect(report.boletins).toHaveLength(3);
    expect(world.pdf.check.mock.calls.length - checksBefore).toBe(1);
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
