import HeaderSection from "@/components/Header/Section/HeaderSection";
import React, { ReactNode } from "react";
import { getContent } from "@/utils/functions";
import Footer from "@/components/Footer/Footer";

import "../app/globals.css";

const HubTemplate = async ({ children }: { children?: ReactNode }) => {
  const { header } = await getContent(["header", "sectionHead"]);

  return (
    <>
      <HeaderSection content={header} />
      <main
        id="root"
        className="flex flex-col items-center h-full grow-1 w-full border-box"
      >
        {children}
      </main>
      <Footer content={header} />
    </>
  );
};

export default HubTemplate;
