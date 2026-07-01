"use client";

import { ITab } from "@/utils/interfaces";
import { ReactElement } from "react";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { useRouter, useSearchParams } from "next/navigation";

export const AboutContent = ({
  tabs,
  tabsHeader,
}: {
  tabs: {
    [key: string]: ReactElement;
  };
  tabsHeader: ITab[];
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "nossa-historia";

  const orderedContent = sortContentByDesiredOrder<ITab>(tabsHeader, [
    "history",
    "compromisso",
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
      <div className="w-full bg-white border-b border-[#BEBBBD]">
        <div
          role="tablist"
          className="flex flex-row items-end gap-4 max-w-[1440px] mx-auto lg:px-20 pt-2 overflow-x-auto scrollbar-hide"
          style={{ height: "60px" }}
        >
          {orderedContent.map((tab, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={currentTab === tab.path}
              onClick={() => handleTabClick(tab.path)}
              style={{ padding: "16px 12px", height: "52px" }}
              className={`flex items-center justify-center font-medium text-[14px] leading-5 transition-colors border-b-2 outline-none focus-visible:ring-2 focus-visible:ring-[#018F39] cursor-pointer ${
                currentTab === tab.path
                  ? "border-[#018F39] text-[#018F39]"
                  : "border-transparent text-[#7E797B] hover:text-[#292829] hover:border-gray-300"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-[1440px]">{tabs[currentTab]}</div>
    </>
  );
};
