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
import { MacroTheme } from "@/utils/interfaces";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { Icon } from "../Icon/Icon";
import { format } from "date-fns";
import { POST_TYPES } from "@/utils/constants";

export function ExploreForm({
  type,
  categories = [],
  initSchema,
  onReset,
  onSubmit,
}: {
  type: "posts" | "panels";
  categories?: { fields: MacroTheme; sys: { id: string } }[];
  onReset: () => void;
  initSchema: { [key: string]: string[] | string | Date | undefined };
  onSubmit: SubmitHandler<{}>;
}) {
  const formSchema = z.object({
    category: z.array(z.string()).optional(),
    type: z.array(z.string()).optional(),
    initDate: z
      .date({
        invalid_type_error: "That's not a date!",
      })
      .optional(),
    finalDate: z
      .date({
        invalid_type_error: "That's not a date!",
      })
      .optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initSchema,
  });

  return (
    <>
      <Popover>
        <Button asChild>
          <PopoverTrigger className="w-fit">
            <Icon id="filter" size={14} />
            Filtros
          </PopoverTrigger>
        </Button>
        <PopoverContent
          className="flex flex-col gap-6 w-auto p-6 box-border pointer-events-auto"
          align="start"
        >
          <h3 className="text-xl font-semibold">Filtros</h3>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((e) => onSubmit(e))}
              className="space-y-8"
            >
              <div className="flex gap-4">
                {[
                  { label: "Início", name: "initDate" },
                  { label: "Fim", name: "finalDate" },
                ].map(({ label, name }, i) => (
                  <FormField
                    key={i}
                    control={form.control}
                    name={name as "initDate" | "finalDate"}
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
              {type == "panels" ? (
                <FormField
                  control={form.control}
                  name="category"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel className="text-lg font-semibold">
                          Categorias dos painéis
                        </FormLabel>
                      </div>
                      {categories?.map((item) => (
                        <FormField
                          key={item.sys.id}
                          control={form.control}
                          name="category"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.sys.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.sys.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([
                                            ...(field?.value || ""),
                                            item.sys.id,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.sys.id,
                                            ),
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {item.fields.name}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="type"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel className="text-lg font-semibold">
                          Tipo de publicação
                        </FormLabel>
                      </div>
                      {Object.entries(POST_TYPES)
                        ?.filter(([key]) => key !== "data-panel")
                        .map(([key, value]) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name="type"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={key}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(key)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...(field?.value || ""),
                                              key,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== key,
                                              ),
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {value}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex w-full justify-end gap-2">
                <Button variant="secondary" type="reset">
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
        className="text-red-600 hover:bg-grey-100"
        onClick={() => {
          form.reset({});
          onReset();
        }}
      >
        <span>Limpar filtros</span>
        <Icon id="no-filter" size={16} />
      </Button>
    </>
  );
}
