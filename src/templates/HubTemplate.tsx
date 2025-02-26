import HeaderSection from "@/components/Header/Section/HeaderSection";
import { Main } from "@/app/globalStyles";
import React, { ReactNode } from "react";
import { getContent } from "@/utils/functions";
import Footer from "@/components/Footer/Footer";
import { ISection } from "@/utils/interfaces";

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
      <HeaderSection
        title={
          sectionHead.find(
            (section: { fields: ISection }) =>
              section.fields.id == "initialBanner",
          ).fields.title || "Data Nordeste"
        }
        content={header}
      />
      <Main id="root" backThumb={backThumb.toString()}>
        {children}
      </Main>
      <Footer content={header} />
    </>
  );
};

export default HubTemplate;
