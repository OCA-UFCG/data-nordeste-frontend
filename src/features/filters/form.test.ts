import { describe, expect, it } from "vitest";
import { createFilterFormSchema, FilterFormValues } from "./form";

describe("filter form schema", () => {
  it("accepts optional date fields and dynamic checkbox groups", () => {
    const schema = createFilterFormSchema([
      {
        title: "Categorias",
        type: "category",
        fields: {
          economy: "Economia",
          health: "Saúde",
        },
      },
      {
        title: "Tipos",
        type: "type_in",
        fields: {
          post: "Post",
        },
      },
    ]);

    const value: FilterFormValues = {
      category: ["economy", "health"],
      type_in: ["post"],
      date_gte: new Date("2024-01-01T00:00:00.000Z"),
      date_lte: undefined,
    };

    expect(schema.parse(value)).toEqual(value);
  });

  it("rejects non-array values for checkbox groups", () => {
    const schema = createFilterFormSchema([
      {
        title: "Licença",
        type: "license",
        fields: {
          cc: "CC",
        },
      },
    ]);

    expect(() => schema.parse({ license: "cc" })).toThrow();
  });

  it("keeps every filter group optional for reset and empty URLs", () => {
    const schema = createFilterFormSchema([
      {
        title: "Download",
        type: "download",
        fields: {
          csv: "CSV",
        },
      },
    ]);

    expect(schema.parse({})).toEqual({});
  });
});
