import { describe, expect, it } from "vitest";
import {
  EMPTY_REPORT_PLACES,
  listReportPlaceNames,
  parseReportPlaces,
} from "./reportPlaces";

describe("parseReportPlaces", () => {
  it("reads the states, areas and cities lists from the proxy payload", () => {
    expect(
      parseReportPlaces({
        states: ["Bahia"],
        areas: ["Caatinga"],
        cities: ["Recife (PE)"],
      }),
    ).toEqual({
      states: ["Bahia"],
      areas: ["Caatinga"],
      cities: ["Recife (PE)"],
    });
  });

  it("turns a missing or malformed list into an empty one", () => {
    expect(parseReportPlaces({ cities: ["Recife (PE)"] })).toEqual({
      states: [],
      areas: [],
      cities: ["Recife (PE)"],
    });
    expect(parseReportPlaces({ states: "Bahia", cities: null })).toEqual(
      EMPTY_REPORT_PLACES,
    );
    expect(parseReportPlaces(["Recife (PE)"])).toEqual(EMPTY_REPORT_PLACES);
    expect(parseReportPlaces(null)).toEqual(EMPTY_REPORT_PLACES);
  });
});

describe("listReportPlaceNames", () => {
  it("lists the states, then the areas, then the cities", () => {
    expect(
      listReportPlaceNames({
        states: ["Bahia"],
        areas: ["Caatinga"],
        cities: ["Recife (PE)"],
      }),
    ).toEqual(["Bahia", "Caatinga", "Recife (PE)"]);
  });
});
