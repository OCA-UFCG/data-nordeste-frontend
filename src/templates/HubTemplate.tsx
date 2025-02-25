import HeaderSection from "@/components/Header/Section/HeaderSection";
import { Main } from "@/app/globalStyles";
import React, { ReactNode } from "react";
import { getContent } from "@/utils/functions";
import Footer from "@/components/Footer/Footer";

const HubTemplate = async ({
  children,
  backThumb = false,
}: {
  children?: ReactNode;
  backThumb?: boolean;
}) => {
  const { header, sectionHead } = await getContent(["header", "sectionHead"]);

  return (
    <>
      <HeaderSection title={sectionHead[0].fields.title} content={header} />
      <Main id="root" backThumb={backThumb.toString()}>
        {children}
      </Main>
      <Footer content={header} />
    </>
  );
};

export default HubTemplate;
