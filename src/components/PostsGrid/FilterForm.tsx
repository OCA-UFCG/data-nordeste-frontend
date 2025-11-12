"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
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

interface FilterGroup {
  title: string;
  type: string;
  fields: { [key: string]: string };
}

export function FilterForm({
  initSchema,
  selectFields,
  filterGroups,
  onReset,
  onSubmit,
  layout = "vertical",
}: {
  initSchema: { [key: string]: string[] | string | Date | undefined };
  onReset: () => void;
  onSubmit: SubmitHandler<{}>;
  layout?: "vertical" | "horizontal";
} & (
  | { selectFields: FilterGroup; filterGroups?: never }
  | { filterGroups: FilterGroup[]; selectFields?: never }
)) {
  const groups = filterGroups || (selectFields ? [selectFields] : []);
  const [open, setOpen] = useState(false);

  const createFormSchema = () => {
    const schemaFields: any = {
      date_gte: z
        .date({
          invalid_type_error: "Isso não é uma data",
        })
        .optional(),
      date_lte: z
        .date({
          invalid_type_error: "Isso não é uma data",
        })
        .optional(),
    };

    groups.forEach((group) => {
      schemaFields[group.type] = z.array(z.string()).optional();
    });

    return z.object(schemaFields);
  };

  const formSchema = createFormSchema();

  const form = useForm<z.infer<typeof formSchema>>({
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
              <div className="flex flex-col md:flex-row gap-4">
                {[
                  { label: "Início", name: "date_gte" },
                  { label: "Fim", name: "date_lte" },
                ].map(({ label, name }, i) => (
                  <FormField
                    key={i}
                    control={form.control}
                    name={name as "date_gte" | "date_lte"}
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
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Escolha uma data</span>
                                )}
                                <Icon
                                  id="calendar"
                                  size={16}
                                  className="opacity-50"
                                />
                              </PopoverTrigger>
                            </Button>
                          </FormControl>
                          <PopoverContent
                            className="w-auto p-0 pointer-events-auto"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {groups.map((group) => (
                <FormField
                  key={group.type}
                  control={form.control}
                  name={group.type as any}
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel className="text-lg font-semibold">
                          {group.title}
                        </FormLabel>
                      </div>
                      <div
                        className={cn(
                          "flex flex-col gap-2",
                          layout === "horizontal" &&
                            "flex-row flex-wrap gap-4 max-w-[200px] md:max-w-[550px]",
                        )}
                      >
                        {Object.entries(group.fields)?.map(([key, val]) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name={group.type as any}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(key)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([
                                            ...(field?.value || []),
                                            key,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (v: any) => v !== key,
                                            ),
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {val}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <div className="flex w-full justify-end gap-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Aplicar</Button>
              </div>
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
