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
import { usePathname } from "next/navigation";

const HeaderModal = ({ content }: { content: { fields: ISection }[] }) => {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="flex items-center">
          <Menu className="h-5 w-5 text-green-900" />
        </div>
      </SheetTrigger>
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo-DNE.png" alt="Logo" className="w-[99px] h-[47px]" />
      </Link>

      <SheetContent
        side="left"
        className="w-full border-t-0 border-b-2 rounded-bl-lg rounded-br-lg shadow-[0px_6px_6px_-1px_#0000001A]"
      >
        <Accordion type="multiple" className="w-full space-y-2 py-4 px-2 pt-0">
          {content
            .filter((item) => item.fields.appears)
            .map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="rounded-sm font-inter text-sm leading-5"
              >
                {item.fields.children && item.fields.children.length > 0 ? (
                  <>
                    <AccordionTrigger className="flex items-center font-inter font-semibold text-sm leading-5 px-2 py-[6px] h-[44px]">
                      {item.fields.name}
                    </AccordionTrigger>
                    <AccordionContent className="py-2 px-2">
                      {item.fields.children!.map((child, i) => {
                        const isActive = pathname === child.fields.path;

                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 py-[6px] px-2 h-[44px] ${isActive ? "text-green-800 hover:bg-green-200" : "hover:text-black"}`}
                          >
                            <Icon
                              id={macroThemes[child.fields.id] || "list"}
                              size={14}
                            />
                            <Link
                              href={child.fields.path}
                              className={`whitespace-nowrap ${isActive ? "" : ""}`}
                            >
                              {child.fields.name}
                            </Link>
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </>
                ) : (
                  <div
                    className={`flex items-center px-2 py-[6px] h-[44px] ${pathname === item.fields.path ? "text-green-800 hover:bg-green-200" : ""}`}
                  >
                    <Link
                      href={item.fields.path}
                      className={`font-semibold ${pathname === item.fields.path ? "" : "hover:text-black"}`}
                    >
                      {item.fields.name}
                    </Link>
                  </div>
                )}
              </AccordionItem>
            ))}
        </Accordion>
      </SheetContent>
    </Sheet>
  );
};

export default HeaderModal;
