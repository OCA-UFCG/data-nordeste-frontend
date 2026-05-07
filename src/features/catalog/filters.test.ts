import { describe, expect, it } from "vitest";
import {
  buildCatalogFilterGroups,
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
  it("parses public URL params into catalog filters", () => {
    const params = new URLSearchParams(
      "category=saude,educacao&sort=mostrecent&date_gte=2024-01-01",
    );

    expect(buildCatalogFilterValues(params, filterGroups)).toEqual({
      category: ["saude", "educacao"],
      date_gte: new Date("2024-01-01"),
      date_lte: undefined,
      sort: "mostrecent",
    });
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
