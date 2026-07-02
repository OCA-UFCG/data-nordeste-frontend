import { describe, expect, it } from "vitest";
import {
  buildCatalogFilterGroups,
  buildCatalogRequest,
  buildCatalogFilterValues,
  buildCatalogUrlParams,
} from "./filters";
import { FilterGroup, Filters } from "@/utils/interfaces";

const filterGroups: FilterGroup[] = [
  {
    title: "Tema",
    type: "category",
    options: [{ slug: "saude", title: "Saúde" }],
  },
];

describe("catalog filters", () => {
  it("builds the server-backed Zenodo request from route params", () => {
    expect(
      buildCatalogRequest(
        { page: "6", category: "saude", sort: "mostrecent" },
        filterGroups,
      ),
    ).toEqual({
      currentPage: 6,
      filterValues: {
        category: ["Saúde"],
        date_gte: undefined,
        date_lte: undefined,
        search: undefined,
        sort: "mostrecent",
      },
    });
  });

  it("parses public URL params into catalog filters", () => {
    const params = new URLSearchParams(
      "category=saude,educacao&sort=mostrecent&date_gte=2024-01-01",
    );

    expect(buildCatalogFilterValues(params, filterGroups)).toEqual({
      category: ["Saúde", "educacao"],
      date_gte: new Date("2024-01-01"),
      date_lte: undefined,
      search: undefined,
      sort: "mostrecent",
    });
  });

  it("translates an accented theme slug to its Zenodo keyword", () => {
    const waterSecurityFilters: FilterGroup[] = [
      {
        title: "Tema",
        type: "category",
        options: [{ slug: "seguranca-hidrica", title: "Segurança Hídrica" }],
      },
    ];

    const request = buildCatalogRequest(
      { category: "seguranca-hidrica" },
      waterSecurityFilters,
    );

    expect(request.filterValues.category).toEqual(["Segurança Hídrica"]);
  });

  it("maps catalog text to the Zenodo search filter", () => {
    const params = new URLSearchParams("q=domicilios");

    expect(buildCatalogFilterValues(params, filterGroups).search).toBe(
      "domicilios",
    );
  });

  it("serializes catalog filters without changing public param names", () => {
    const filters: Filters = {
      category: ["saude"],
      date_lte: new Date("2024-12-31T00:00:00.000Z"),
    };

    expect(buildCatalogUrlParams(filters, 2).toString()).toBe(
      "category=saude&date_lte=2024-12-31T00%3A00%3A00.000Z&page=2",
    );
  });

  it("builds filter form groups from Contentful filter records", () => {
    expect(buildCatalogFilterGroups(filterGroups)).toEqual([
      { title: "Tema", type: "category", fields: { saude: "Saúde" } },
    ]);
  });
});
