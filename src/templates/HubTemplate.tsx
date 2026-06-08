import HeaderSection from "@/components/Header/Section/HeaderSection";
import React, { ReactNode } from "react";
import Footer from "@/components/Footer/Footer";

import "../app/globals.css";
import { HEAD_QUERY } from "@/utils/queries";
import { getContent } from "@/utils/contentful";
import { ISection } from "@/utils/interfaces";

type HubTemplateProps = {
  children?: ReactNode;
  showFooter?: boolean;
};

const HubTemplate = async ({
  children,
  showFooter = true,
}: HubTemplateProps) => {
  const {
    headerCollection: header,
  }: { headerCollection: { items: ISection[] } } = await getContent(HEAD_QUERY);

  return (
    <>
      <HeaderSection content={header.items} />
      <main
        id="root"
        className="flex flex-col items-center flex-1 min-h-0 w-full border-box"
      >
        {children}
      </main>
      {showFooter && <Footer content={header.items} />}
    </>
  );
};

export default HubTemplate;
