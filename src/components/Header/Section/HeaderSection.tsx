"use client";

import HeaderModal from "@/components/Header/Modal/HeaderModal";
import { ISection } from "@/utils/interfaces";
import Header from "../Header";
import { sortContentByDesiredOrder } from "@/utils/functions";

const HeaderSection = ({ content }: { content: { fields: ISection }[] }) => {
  const orderedContent = sortContentByDesiredOrder(content, [
    "home",
    "about",
    "explore",
    "posts",
    "projects",
  ]);

  return (
    <div className="sticky top-0 left-0 z-5 bg-white">
      <div className="lg:hidden w-full h-[80px] flex border-b-2 justify-between px-[24px] py-[18px]">
        <HeaderModal content={orderedContent} />
      </div>

      <div className="hidden lg:block w-full h-[80px]">
        <Header content={orderedContent} />
      </div>
    </div>
  );
};

export default HeaderSection;
