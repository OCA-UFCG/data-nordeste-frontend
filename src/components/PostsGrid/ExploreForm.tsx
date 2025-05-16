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
import { useSearchParams } from "next/navigation";
import { MacroTheme } from "@/utils/interfaces";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { Icon } from "../Icon/Icon";
import { format } from "date-fns";

export function ExploreForm({
  categories = [],
  onSubmit,
}: {
  categories?: { fields: MacroTheme; sys: { id: string } }[];
  onSubmit: SubmitHandler<{
    "fields.category.sys.id[in]"?: string | undefined;
    "fields.date[gte]"?: string | undefined;
    "fields.date[lte]"?: string | undefined;
  }>;
}) {
  const formSchema = z.object({
    category: z.array(z.string()).optional(),
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

  const params = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: params.get(`categories`)?.split(`,`) || [],
      initDate:
        params.get(`initDate`) != null
          ? new Date(params.get(`initDate`) || "")
          : undefined,
      finalDate:
        params.get(`finalDate`) != null
          ? new Date(params.get(`finalDate`) || "")
          : undefined,
    },
  });

  const parseForm = (currentForm: {
    [key: string]: string | string[] | Date;
  }) => {
    const parseMap: {
      [key: string]: { name: string; formatFunc: (params: any) => any };
    } = {
      category: {
        name: "fields.category.sys.id[in]",
        formatFunc: (selectedCats: string[]) =>
          selectedCats.length > 0 && !("all" in selectedCats)
            ? selectedCats.join(",")
            : categories.map((cat) => cat.sys.id).join(","),
      },
      initDate: {
        name: "fields.date[gte]",
        formatFunc: (date: Date) => (date ? date.toISOString() : null),
      },

      finalDate: {
        name: "fields.date[lte]",
        formatFunc: (date: Date) => (date ? date.toISOString() : null),
      },
    };

    const finalForm: { [key: string]: string | string[] } = {};

    Object.entries(currentForm).map(
      ([key, value]: [string, string | string[] | Date]) => {
        const formatedValue = parseMap[key].formatFunc(value);
        if (formatedValue) {
          finalForm[parseMap[key].name] = formatedValue;
        }
      },
    );
    console.log(finalForm);

    return finalForm;
  };

  return (
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
            onSubmit={form.handleSubmit((e) => onSubmit(parseForm(e)))}
            className="space-y-8"
          >
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="initDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Início</FormLabel>
                    <Popover>
                      <FormControl>
                        <PopoverTrigger className="w-fit" asChild>
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
                                <span>Pick a date</span>
                              )}
                              <Icon
                                id="calendar"
                                size={16}
                                className="opacity-50"
                              />
                            </PopoverTrigger>
                          </Button>
                        </PopoverTrigger>
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
              <FormField
                control={form.control}
                name="finalDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fim</FormLabel>
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
                              <span>Pick a date</span>
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
            </div>
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
            <div className="flex w-full justify-end gap-2">
              <Button variant="secondary" type="reset">
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
