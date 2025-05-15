"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";

export function ExploreForm({
  categories = [],
  onSubmit,
}: {
  categories?: { fields: MacroTheme; sys: { id: string } }[];
  onSubmit: SubmitHandler<{
    "fields.category.sys.id[in]"?: string | undefined;
  }>;
}) {
  const formSchema = z.object({
    category: z.array(z.string()).optional(),
    initDate: z.date({
      required_error: "A date of birth is required.",
    }),
  });

  const params = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: params.get(`categories`)?.split(`,`) || [],
      initDate: new Date(params.get(`initDate`) || new Date()),
    },
  });

  const parseForm = (currentForm: {
    [key: string]: string | string[] | Date;
  }) => {
    const parseMap: {
      [key: string]: { name: string; formatFunc: (params: any) => string };
    } = {
      category: {
        name: "fields.category.sys.id[in]",
        formatFunc: (categories: string[]) =>
          categories.length > 0 ? categories.join(",") : "all",
      },
      initDate: {
        name: "fields.date[gte]",
        formatFunc: (date: string) => date,
      },
    };

    const finalForm: { [key: string]: string | string[] } = {};

    Object.entries(currentForm).map(
      ([key, value]: [string, string | string[] | Date]) => {
        finalForm[parseMap[key].name] = parseMap[key].formatFunc(value);
      },
    );

    console.log(finalForm);
    return finalForm;
  };

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((e) => onSubmit(parseForm(e)))}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="initDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
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
        {/* <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
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
                                      (value) => value !== item.sys.id
                                    )
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
        /> */}
        <div className="flex gap-2">
          <Button variant="secondary" type="reset">
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  );
}
