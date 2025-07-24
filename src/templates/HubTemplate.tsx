import HeaderSection from "@/components/Header/Section/HeaderSection";
import React, { ReactNode } from "react";
import Footer from "@/components/Footer/Footer";

import "../app/globals.css";
import { HEAD_QUERY } from "@/utils/queries";
import { getContent } from "@/utils/contentful";
import { ISection } from "@/utils/interfaces";

const HubTemplate = async ({ children }: { children?: ReactNode }) => {
  const {
    headerCollection: header,
  }: { headerCollection: { items: ISection[] } } = await getContent(HEAD_QUERY);

  return (
    <>
      <HeaderSection content={header.items} />
      <main
        id="root"
        className="flex flex-col items-center h-full grow-1 w-full border-box"
      >
        {children}
      </main>
      <Footer content={header.items} />
    </>
  );
};

export default HubTemplate;
