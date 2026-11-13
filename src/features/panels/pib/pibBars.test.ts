import { describe, expect, it } from "vitest";
import {
  buildAtividadeBars,
  buildVabBars,
  pibBarUnit,
} from "@/features/panels/pib/pibBars";

describe("pibBarUnit", () => {
  it("follows the size of the highest value", () => {
    expect(pibBarUnit(1.2e12).label).toBe("trilhões");
    expect(pibBarUnit(4.1e11).label).toBe("bilhões");
    expect(pibBarUnit(8.5e7).label).toBe("milhões");
    expect(pibBarUnit(4200).label).toBe("mil");
    expect(pibBarUnit(0)).toEqual({ divisor: 1, label: "reais" });
  });
});

describe("buildVabBars", () => {
  const vab = [
    { label: "Agropecuária", value: 55.43e9 },
    { label: "Serviços", value: 413.89e9 },
    { label: "Indústria", value: 158.36e9 },
    { label: "Administração Pública", value: 211.92e9 },
  ];

  it("sorts the sectors and builds a round axis in the data unit", () => {
    const bars = buildVabBars(vab);

    expect(bars.rows.map((row) => row.label)).toEqual([
      "Serviços",
      "Administração Pública",
      "Indústria",
      "Agropecuária",
    ]);
    expect(bars.unit.label).toBe("bilhões");
    expect(bars.ticks).toEqual([0, 120, 240, 360, 480]);
    expect(bars.rows[0].share).toBeCloseTo(413.89 / 480);
    expect(bars.total).toBeCloseTo(839.6e9);
  });

  it("switches to millions for a small municipality", () => {
    const bars = buildVabBars([
      { label: "Serviços", value: 85e6 },
      { label: "Indústria", value: 12e6 },
    ]);

    expect(bars.unit.label).toBe("milhões");
    expect(bars.ticks).toEqual([0, 25, 50, 75, 100]);
  });

  it("hides the bar of a negative sector but keeps its value", () => {
    const bars = buildVabBars([
      { label: "Serviços", value: 85e6 },
      { label: "Indústria", value: -3e6 },
    ]);

    expect(bars.rows[1]).toMatchObject({ value: -3e6, share: 0 });
  });

  it("returns an empty chart without sectors", () => {
    expect(buildVabBars([])).toMatchObject({ rows: [], total: 0 });
  });
});

describe("buildAtividadeBars", () => {
  const atividades = [
    { label: "Comércio", value: 9.1 },
    { label: "Demais serviços", value: 26.8 },
    { label: "Administração pública", value: 21.3 },
    { label: "Indústrias de transformação", value: 7.4 },
    { label: "Sem participação", value: 0 },
  ];

  it("keeps the three largest activities on an axis of tens", () => {
    const bars = buildAtividadeBars(atividades);

    expect(bars.rows.map((row) => row.label)).toEqual([
      "Demais serviços",
      "Administração pública",
      "Comércio",
    ]);
    expect(bars.ticks).toEqual([0, 10, 20, 30]);
    expect(bars.rows[0].share).toBeCloseTo(26.8 / 30);
  });

  it("never shrinks the axis below 20%", () => {
    expect(buildAtividadeBars([{ label: "Comércio", value: 4 }]).ticks).toEqual(
      [0, 10, 20],
    );
  });

  it("drops activities without a share", () => {
    expect(
      buildAtividadeBars([{ label: "Sem participação", value: 0 }]).rows,
    ).toEqual([]);
  });
});
