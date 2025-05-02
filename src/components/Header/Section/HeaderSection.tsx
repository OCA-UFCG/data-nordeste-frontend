"use client";

import HeaderModal from "@/components/Header/Modal/HeaderModal";
import { ISection } from "@/utils/interfaces";
import Header from "../Header";
import { sortContentByDesiredOrder } from "@/utils/functions";

const HeaderSection = ({ content }: { content: { fields: ISection }[] }) => {
  const orderedContent = sortContentByDesiredOrder(content);

  return (
    <div>
      <div className="lg:hidden w-full h-[80px] flex justify-between border-b-2 justify-between px-[24px] py-[18px]">
        <HeaderModal content={orderedContent} />
      </div>

      <div className="hidden lg:block w-full h-[80px] fixed left-0 right-0 z-5 ">
        <Header content={orderedContent} />
      </div>
    </div>
  );
};

export default HeaderSection;
