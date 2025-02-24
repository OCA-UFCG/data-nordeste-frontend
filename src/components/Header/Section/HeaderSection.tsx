"use client";

import HeaderModal from "@/components/Header/Modal/HeaderModal";
import { MainHeader, Wrapper } from "./HeaderSection.styles";

const HeaderSection = () => {
  return (
    <Wrapper>
      <HeaderModal />
      <MainHeader />
    </Wrapper>
  );
};

export default HeaderSection;
