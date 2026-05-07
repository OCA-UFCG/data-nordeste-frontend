import { z } from "zod";

export type FilterFormValue = string | string[] | Date | undefined;

export type FilterFormValues = Record<string, FilterFormValue>;

export type FilterOptionFields = Record<string, string>;

export type FilterFormGroup = {
  title: string;
  type: string;
  fields: FilterOptionFields;
};

export const DATE_FILTER_FIELDS = [
  { label: "Início", name: "date_gte" },
  { label: "Fim", name: "date_lte" },
] as const;

export type DateFilterFieldName = (typeof DATE_FILTER_FIELDS)[number]["name"];

const filterFormValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.date(),
  z.undefined(),
]);

export const createFilterFormSchema = (
  groups: FilterFormGroup[],
): z.ZodType<FilterFormValues, FilterFormValues> => {
  const schemaFields: Record<string, z.ZodType<FilterFormValue>> = {
    date_gte: z
      .date({
        error: "Isso não é uma data",
      })
      .optional(),
    date_lte: z
      .date({
        error: "Isso não é uma data",
      })
      .optional(),
  };

  groups.forEach((group) => {
    schemaFields[group.type] = z.array(z.string()).optional();
  });

  return z
    .object(schemaFields)
    .catchall(filterFormValueSchema) as unknown as z.ZodType<
    FilterFormValues,
    FilterFormValues
  >;
};
