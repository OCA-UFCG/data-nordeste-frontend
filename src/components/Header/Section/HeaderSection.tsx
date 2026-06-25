"use client";

import HeaderModal from "@/components/Header/Modal/HeaderModal";
import { ISection } from "@/utils/interfaces";
import Header from "../Header";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { Suspense } from "react";

const NAVIGATION_IDS = ["home", "explore", "catalog", "connections", "about"];
const NAVIGATION_ID_SET = new Set(NAVIGATION_IDS);

const HeaderSection = ({ content }: { content: ISection[] }) => {
  const orderedContent = sortContentByDesiredOrder<ISection>(
    content.filter((item) => NAVIGATION_ID_SET.has(item.id)),
    NAVIGATION_IDS,
  );

  return (
    <div className="sticky top-0 left-0 z-50 bg-white">
      <div className="xl:hidden w-full h-[80px] flex border-b-2 justify-between px-4 py-[18px]">
        <Suspense>
          <HeaderModal content={orderedContent} />
        </Suspense>
      </div>

      <div className="hidden xl:block w-full h-[80px]">
        <Suspense>
          <Header content={orderedContent} />
        </Suspense>
      </div>
    </div>
  );
};

export default HeaderSection;
