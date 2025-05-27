"use client";

import { ITab } from "@/utils/interfaces";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "../ui/navigation-menu";
import { JSXElementConstructor, ReactElement } from "react";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { useRouter, useSearchParams } from "next/navigation";

export const AboutContent = ({
  tabs,
  tabsHeader,
}: {
  tabs: {
    [key: string]: ReactElement<any, string | JSXElementConstructor<any>>;
  };
  tabsHeader: { fields: ITab }[];
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "nossa-historia";

  const orderedContent = sortContentByDesiredOrder<ITab>(tabsHeader, [
    "history",
    "mission",
    "partners",
    "contact",
  ]);

  const handleTabClick = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <section className="flex justify-center w-full h-[60px] border-b border-grey-400">
        <NavigationMenu className="flex flex-row justify-start w-full max-w-[1440px] mx-6 lg:mx-20 overflow-x-auto overflow-y-hidden">
          <NavigationMenuList className="gap-4 min-w-max">
            {orderedContent.map((tab, idx) => (
              <NavigationMenuItem key={idx}>
                <button
                  onClick={() => handleTabClick(tab.fields.path)}
                  className={`cursor-pointer text-md text-center pt-[20px] pb-[18px] px-[12px] rounded-none box-border ${
                    currentTab === tab.fields.path
                      ? "text-green-800 border-b-10 border-b-green-800"
                      : "text-muted-foreground"
                  }`}
                >
                  {tab.fields.name}
                </button>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </section>
      {tabs[currentTab]}
    </>
  );
};
