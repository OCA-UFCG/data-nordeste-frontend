import HubTemplate from "@/templates/HubTemplate";
import PageHeader from "@/components/PageHeader/PageHeader";
import ContactSection from "@/components/ContactSection/ContactSection";
import PartnersSection from "@/components/PartnersSection/PartnersSection";
import HistorySection from "@/components/HistorySection/HistorySection";
import ValuesSection from "@/components/ValuesSection/ValuesSection";
import { AboutContent } from "@/components/AboutContent/AboutContent";
import { Suspense } from "react";
import { REVALIDATE } from "@/utils/constants";
import {
  IAbout,
  IContact,
  IPageHeader,
  IPartners,
  ITab,
  IValues,
} from "@/utils/interfaces";
import { ABOUT_PAGE_QUERY, ABOUT_QUERY } from "@/utils/queries";
import { getContent } from "@/utils/contentful";

export const revalidate = REVALIDATE;

interface IAboutContent {
  pageHeadersCollection: { items: IPageHeader[] };
  pageTabsCollection: { items: ITab[] };
  contactInfoCollection: { items: IContact[] };
  partnersInfoCollection: { items: IPartners[] };
}

interface IAboutTab {
  aboutCollection: { items: IAbout[] };
  visionMissionValuesCollection: { items: IValues[] };
}

export default async function AboutPage() {
  const {
    pageHeadersCollection: { items: pageHeaders },
    pageTabsCollection: { items: pageTabs },
    contactInfoCollection: { items: contactInfo },
    partnersInfoCollection: { items: partnersInfo },
  }: IAboutContent = await getContent(ABOUT_PAGE_QUERY);

  const {
    aboutCollection: { items: about },
    visionMissionValuesCollection: { items: visionMissionValues },
  }: IAboutTab = await getContent(ABOUT_QUERY);

  const tabs: { [key: string]: React.ReactElement } = {
    contato: <ContactSection content={contactInfo} />,
    "rede-colaboracao": <PartnersSection content={partnersInfo[0]} />,
    "nossa-historia": <HistorySection content={about[0]} />,
    compromisso: <ValuesSection content={visionMissionValues} />,
  };

  return (
    <HubTemplate>
      <PageHeader content={pageHeaders[0]} />
      <Suspense>
        <AboutContent tabs={tabs} tabsHeader={pageTabs} />
      </Suspense>
    </HubTemplate>
  );
}
