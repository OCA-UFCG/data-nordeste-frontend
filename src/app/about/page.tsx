import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import PageHeader from "@/components/PageHeader/PageHeader";
import ContactSection from "@/components/ContactSection/ContactSection";
import PartnersSection from "@/components/PartnersSection/PartnersSection";
import HistorySection from "@/components/HistorySection/HistorySection";
import ValuesSection from "@/components/ValuesSection/ValuesSection";
import { AboutContent } from "@/components/AboutContent/AboutContent";
import { Suspense } from "react";

export const revalidate = 60;

export default async function AboutPage() {
  const {
    pageHeaders,
    pageTabs,
    about,
    contactInfo,
    partnersInfo,
    visionMissionValues,
  } = await getContent([
    "pageHeaders",
    "pageTabs",
    "about",
    "contactInfo",
    "partnersInfo",
    "visionMissionValues",
  ]);

  const tabs: { [key: string]: React.ReactElement } = {
    contato: <ContactSection content={contactInfo} />,
    "rede-colaboracao": <PartnersSection content={partnersInfo[0]} />,
    "nossa-historia": <HistorySection content={about[0]} />,
    compromisso: <ValuesSection content={visionMissionValues} />,
  };

  return (
    <HubTemplate>
      <PageHeader
        content={pageHeaders.find(
          (section: { fields: { id: string } }) =>
            section.fields.id === "about",
        )}
      />
      <Suspense>
        <AboutContent tabs={tabs} tabsHeader={pageTabs} />
      </Suspense>
    </HubTemplate>
  );
}
