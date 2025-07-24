"use client";

import { ISection } from "@/utils/interfaces";

import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { macroThemes } from "@/utils/constants";
import { Icon } from "@/components/Icon/Icon";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { isHrefActive } from "@/utils/functions";
import { cn } from "@/lib/utils";

const HeaderModal = ({ content }: { content: ISection[] }) => {
  const pathname = usePathname();
  const category = useSearchParams().get("category");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="flex items-center">
          <Menu className="h-[40px] w-[40px] text-green-900 hover:bg-green-neutro p-2 box-border cursor-pointer rounded-lg transition duration-300" />
        </div>
      </SheetTrigger>

      <Link href="/" className="flex items-center gap-2">
        <Icon id="logo-DNE" width={99} height={47} />
      </Link>

      <SheetContent
        side="top"
        className="w-full border-t-0 border-b-2 rounded-bl-lg rounded-br-lg shadow-[0px_6px_6px_-1px_#0000001A]"
      >
        <Accordion type="multiple" className="w-full space-y-2 py-4 px-2 pt-0">
          {content
            .filter((item) => item.appears)
            .map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="rounded-sm font-inter text-sm leading-5"
              >
                {item.childrenCollection &&
                item.childrenCollection.items &&
                item.childrenCollection.items.length > 0 ? (
                  <>
                    <AccordionTrigger
                      className={cn(
                        "flex items-center font-inter font-semibold text-sm leading-5 px-2 py-[6px] h-[44px] hover:bg-green-neutro cursor-pointer",
                        pathname.startsWith("/" + item.id) && "text-green-900",
                      )}
                    >
                      {item.name}
                    </AccordionTrigger>
                    <AccordionContent className="py-2 px-2">
                      {item.childrenCollection.items.map((child, i) => {
                        const isActive = isHrefActive(
                          pathname,
                          category,
                          child.path,
                        );

                        return (
                          <Link
                            key={i}
                            href={child.path}
                            onClick={() => setOpen(false)}
                          >
                            <div
                              className={`flex items-center gap-2 py-[6px] px-2 h-[44px] hover:bg-green-neutro cursor-pointer ${isActive ? "text-green-900" : ""}`}
                            >
                              <Icon
                                id={macroThemes[child.id] || "list"}
                                size={14}
                              />
                              <span className="whitespace-nowrap">
                                {child.name}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </AccordionContent>
                  </>
                ) : (
                  <Link href={item.path} onClick={() => setOpen(false)}>
                    <div
                      className={`flex items-center px-2 py-[6px] h-[44px] hover:bg-green-neutro cursor-pointer ${isHrefActive(pathname, category, item.path) ? "text-green-900" : ""}`}
                    >
                      <span className="font-semibold">{item.name}</span>
                    </div>
                  </Link>
                )}
              </AccordionItem>
            ))}
        </Accordion>
      </SheetContent>
    </Sheet>
  );
};

export default HeaderModal;
