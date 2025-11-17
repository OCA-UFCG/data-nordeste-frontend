"use client";

import HeaderModal from "@/components/Header/Modal/HeaderModal";
import { ISection } from "@/utils/interfaces";
import Header from "../Header";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { Suspense } from "react";

const HeaderSection = ({ content }: { content: ISection[] }) => {
  const orderedContent = sortContentByDesiredOrder<ISection>(content, [
    "home",
    "about",
    "explore",
    "posts",
    "projects",
  ]);

  return (
    <div className="sticky top-0 left-0 z-40 bg-white">
      <div className="lg:hidden w-full h-[80px] flex border-b-2 justify-between px-4 py-[18px]">
        <Suspense>
          <HeaderModal content={orderedContent} />
        </Suspense>
      </div>

      <div className="hidden lg:block w-full h-[80px]">
        <Suspense>
          <Header content={orderedContent} />
        </Suspense>
      </div>
    </div>
  );
};

export default HeaderSection;
