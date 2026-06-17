import HeaderSection from "@/components/Header/Section/HeaderSection";
import React, { ReactNode } from "react";
import Footer from "@/components/Footer/Footer";

import "../app/globals.css";
import { HEAD_QUERY } from "@/utils/queries";
import { getContent } from "@/utils/contentful";
import { ISection } from "@/utils/interfaces";
import { uniqueById } from "@/utils/functions";

const HubTemplate = async ({ children }: { children?: ReactNode }) => {
  const {
    headerCollection: header,
  }: { headerCollection: { items: ISection[] } } = await getContent(
    HEAD_QUERY,
    undefined,
    { ignoreUnresolvableLinks: true },
  );
  const headerItems = uniqueById(header.items);

  return (
    <>
      <HeaderSection content={headerItems} />
      <main
        id="root"
        className="flex flex-col items-center h-full grow-1 w-full border-box"
      >
        {children}
      </main>
      <Footer content={headerItems} />
    </>
  );
};

export default HubTemplate;
