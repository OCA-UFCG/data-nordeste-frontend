import { describe, expect, it } from "vitest";
import {
  indexOptions,
  sameValues,
  searchOptions,
  toggleValue,
} from "@/features/panels/filterOptions";

const OPTIONS = indexOptions([
  { value: "2507507", label: "João Pessoa (PB)" },
  { value: "2611606", label: "Recife (PE)" },
  { value: "2304400", label: "Fortaleza (CE)" },
]);

const values = (options: { value: string }[]) =>
  options.map((option) => option.value);

describe("searchOptions", () => {
  it("matches ignoring accents and case", () => {
    expect(values(searchOptions(OPTIONS, "  JOAO ", []))).toEqual(["2507507"]);
  });

  it("puts pinned options first and keeps the rest in order", () => {
    expect(values(searchOptions(OPTIONS, "", ["2304400"]))).toEqual([
      "2304400",
      "2507507",
      "2611606",
    ]);
  });
});

describe("toggleValue", () => {
  it("adds a missing value and removes a selected one", () => {
    expect(toggleValue(["2611606"], "2304400")).toEqual(["2611606", "2304400"]);
    expect(toggleValue(["2611606", "2304400"], "2611606")).toEqual(["2304400"]);
  });
});

describe("sameValues", () => {
  it("ignores order but not membership", () => {
    expect(sameValues(["A", "B"], ["B", "A"])).toBe(true);
    expect(sameValues(["A", "B"], ["A"])).toBe(false);
    expect(sameValues(["A"], ["B"])).toBe(false);
  });
});
