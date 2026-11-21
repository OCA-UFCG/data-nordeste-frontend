import { describe, expect, it } from "vitest";
import { formatMetrics } from "./prometheusFormat";

const WORKING = { ok: true, latencyMs: 250 };
const TIMED_OUT = { ok: false, latencyMs: 8000, error: "timeout" };

describe("formatMetrics", () => {
  it("keeps the labels of the _up series fixed, whatever the failure", () => {
    const body = formatMetrics({
      dependencies: { contentful: TIMED_OUT, zenodo: WORKING },
      boletins: [
        { ...TIMED_OUT, id: "b1", title: "Turismo", error: "HTTP 503" },
        { ...WORKING, id: "b2", title: "Saúde" },
      ],
    });

    expect(body).toContain('datane_dependency_up{dependency="contentful"} 0');
    expect(body).toContain('datane_dependency_up{dependency="zenodo"} 1');
    expect(body).toContain('datane_boletim_up{id="b1",titulo="Turismo"} 0');
    expect(body).toContain('datane_boletim_up{id="b2",titulo="Saúde"} 1');
  });

  it("gives the reason of each failure in a separate _error series", () => {
    const body = formatMetrics({
      dependencies: { contentful: TIMED_OUT },
      boletins: [{ ...TIMED_OUT, id: "b1", title: "T", error: "not_a_pdf" }],
    });

    expect(body).toContain(
      'datane_dependency_error{dependency="contentful",error="timeout"} 1',
    );
    expect(body).toContain('datane_boletim_error{id="b1",error="not_a_pdf"} 1');
  });

  it("emits no _error series for what works", () => {
    const body = formatMetrics({
      dependencies: { zenodo: WORKING },
      boletins: [{ ...WORKING, id: "b2", title: "Saúde" }],
    });

    expect(body).not.toContain("datane_dependency_error{");
    expect(body).not.toContain("datane_boletim_error{");
  });

  it("escapes quotes, backslashes and line breaks in label values", () => {
    const body = formatMetrics({
      dependencies: {},
      boletins: [{ ...WORKING, id: "a\\b", title: 'Água "boa"\nnova' }],
    });

    expect(body).toContain(
      'datane_boletim_up{id="a\\\\b",titulo="Água \\"boa\\"\\nnova"} 1',
    );
  });

  it("reports the latency in seconds", () => {
    const body = formatMetrics({
      dependencies: { zenodo: { ok: true, latencyMs: 1500 } },
      boletins: [],
    });

    expect(body).toContain(
      'datane_dependency_latency_seconds{dependency="zenodo"} 1.5',
    );
  });

  it("still declares every metric when there is nothing to report", () => {
    const body = formatMetrics({ dependencies: {}, boletins: [] });

    expect(body.match(/^# TYPE datane_\w+ gauge$/gm)).toHaveLength(5);
    expect(body).not.toContain("datane_boletim_up{");
  });
});
