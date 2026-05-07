"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, UseFormReturn, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { Icon } from "../Icon/Icon";
import { format } from "date-fns";
import { useState } from "react";
import {
  createFilterFormSchema,
  DATE_FILTER_FIELDS,
  DateFilterFieldName,
  FilterFormGroup,
  FilterFormValues,
} from "@/features/filters/form";

export function FilterForm({
  initSchema,
  selectFields,
  filterGroups,
  onReset,
  onSubmit,
  layout = "vertical",
}: {
  initSchema: FilterFormValues;
  onReset: () => void;
  onSubmit: SubmitHandler<FilterFormValues>;
  layout?: "vertical" | "horizontal";
} & (
  | { selectFields: FilterFormGroup; filterGroups?: never }
  | { filterGroups: FilterFormGroup[]; selectFields?: never }
)) {
  const groups = filterGroups || (selectFields ? [selectFields] : []);
  const [open, setOpen] = useState(false);
  const formSchema = createFilterFormSchema(groups);
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initSchema,
  });

  return (
    <div className="flex gap-4 items-center w-full justify-end">
      <Popover open={open} onOpenChange={setOpen}>
        <Button asChild className="grow lg:grow-0">
          <PopoverTrigger>
            <Icon id="filter" size={14} />
            Filtros
          </PopoverTrigger>
        </Button>
        <PopoverContent
          collisionPadding={{
            top: 5000,
          }} /* Huge number so the popover never pops on top */
          className="flex flex-col gap-6 w-auto p-6 box-pointer-events-auto overflow-auto max-h-screen z-0"
          align="start"
        >
          <h3 className="text-xl font-semibold">Filtros</h3>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(async (data) => {
                await onSubmit(data);
                setOpen(false);
              })}
              className="space-y-8"
            >
              <DateRangeFields form={form} />

              {groups.map((group) => (
                <CheckboxFilterGroup
                  key={group.type}
                  form={form}
                  group={group}
                  layout={layout}
                />
              ))}

              <FilterPopoverActions onCancel={() => setOpen(false)} />
            </form>
          </Form>
        </PopoverContent>
      </Popover>
      <Button
        variant="secondary"
        className="text-red-600 hover:bg-grey-100 grow lg:grow-0 lg:w-fit"
        onClick={() => {
          onReset();
          form.reset({});
        }}
      >
        <span>Limpar filtros</span>
        <Icon id="no-filter" size={16} />
      </Button>
    </div>
  );
}

const DateRangeFields = ({
  form,
}: {
  form: UseFormReturn<FilterFormValues>;
}) => (
  <div className="flex flex-col md:flex-row gap-4">
    {DATE_FILTER_FIELDS.map(({ label, name }) => (
      <DateRangeField key={name} form={form} label={label} name={name} />
    ))}
  </div>
);

const DateRangeField = ({
  form,
  label,
  name,
}: {
  form: UseFormReturn<FilterFormValues>;
  label: string;
  name: DateFilterFieldName;
}) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem className="flex flex-col">
        <FormLabel>{label}</FormLabel>
        <Popover>
          <FormControl>
            <Button
              asChild
              variant={"outline"}
              className={cn(
                "cursor-pointer flex justify-between items-center min-w-[200px] pl-3 text-left font-normal rounded-lg py-1 px-2 border border-grey-200",
                !field.value && "text-muted-foreground",
              )}
            >
              <PopoverTrigger className="w-fit">
                {field.value instanceof Date ? (
                  format(field.value, "PPP")
                ) : (
                  <span>Escolha uma data</span>
                )}
                <Icon id="calendar" size={16} className="opacity-50" />
              </PopoverTrigger>
            </Button>
          </FormControl>
          <PopoverContent
            className="w-auto p-0 pointer-events-auto"
            align="start"
          >
            <Calendar
              mode="single"
              selected={field.value instanceof Date ? field.value : undefined}
              onSelect={field.onChange}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    )}
  />
);

const CheckboxFilterGroup = ({
  form,
  group,
  layout,
}: {
  form: UseFormReturn<FilterFormValues>;
  group: FilterFormGroup;
  layout: "vertical" | "horizontal";
}) => (
  <FormField
    control={form.control}
    name={group.type}
    render={() => (
      <FormItem>
        <div className="mb-2">
          <FormLabel className="text-lg font-semibold">{group.title}</FormLabel>
        </div>
        <div
          className={cn(
            "flex flex-col gap-2",
            layout === "horizontal" &&
              "flex-row flex-wrap gap-4 max-w-[200px] md:max-w-[550px]",
          )}
        >
          {Object.entries(group.fields)?.map(([key, val]) => (
            <CheckboxFilterOption
              key={key}
              form={form}
              groupType={group.type}
              optionKey={key}
              label={val}
            />
          ))}
        </div>
        <FormMessage />
      </FormItem>
    )}
  />
);

const CheckboxFilterOption = ({
  form,
  groupType,
  optionKey,
  label,
}: {
  form: UseFormReturn<FilterFormValues>;
  groupType: string;
  optionKey: string;
  label: string;
}) => (
  <FormField
    control={form.control}
    name={groupType}
    render={({ field }) => {
      const selectedValues = Array.isArray(field.value) ? field.value : [];

      return (
        <FormItem className="flex items-center space-x-2">
          <FormControl>
            <Checkbox
              checked={selectedValues.includes(optionKey)}
              onCheckedChange={(checked) => {
                return checked
                  ? field.onChange([...selectedValues, optionKey])
                  : field.onChange(
                      selectedValues.filter((value) => value !== optionKey),
                    );
              }}
            />
          </FormControl>
          <FormLabel className="text-sm font-normal">{label}</FormLabel>
        </FormItem>
      );
    }}
  />
);

const FilterPopoverActions = ({ onCancel }: { onCancel: () => void }) => (
  <div className="flex w-full justify-end gap-2">
    <Button variant="secondary" onClick={onCancel}>
      Cancelar
    </Button>
    <Button type="submit">Aplicar</Button>
  </div>
);
