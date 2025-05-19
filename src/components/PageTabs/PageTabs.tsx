"use client";
import { ITab } from "@/utils/interfaces";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu";

import { useSearchParams } from "next/navigation";
import { sortContentByDesiredOrder } from "@/utils/functions";

const PageTabs = ({ content }: { content: { fields: ITab }[] }) => {
  const orderedContent = sortContentByDesiredOrder<ITab>(content, [
    "history",
    "mission",
    "partners",
    "contact",
  ]);

  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  return (
    <section className="w-full border-b border-grey-400">
      <NavigationMenu className="flex flex-row justify-start h-[60px] py-2 px-7 w-full max-w-[1440px] mx-auto overflow-x-auto overflow-y-hidden">
        <NavigationMenuList className="gap-4 min-w-max">
          {orderedContent.map((tab, idx) => (
            <NavigationMenuItem key={idx}>
              <NavigationMenuLink
                href={`?tab=${tab.fields.path}`}
                className={`text-md text-center pt-[20px] pb-[14px] px-[12px] rounded-none ${
                  activeTab === tab.fields.path
                    ? "text-green-800 border-b-2 border-b-green-800"
                    : "text-muted-foreground"
                }`}
              >
                {tab.fields.name}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </section>
  );
};

export default PageTabs;
