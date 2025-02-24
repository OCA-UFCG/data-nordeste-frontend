"use client";

import HeaderModal from "@/components/Header/Modal/HeaderModal";
import { Logo, MainHeader, Wrapper } from "./HeaderSection.styles";
import { ISection } from "@/utils/interfaces";
import Link from "next/link";

const HeaderSection = ({ content }: { content: { fields: ISection }[] }) => {
  console.log(content);

  return (
    <Wrapper>
      <HeaderModal content={content} />
      <Link href="/">
        <Logo src="/logo.png" alt="datane logo" width={45} height={45} />
      </Link>
      <MainHeader content={content} />
    </Wrapper>
  );
};

export default HeaderSection;
