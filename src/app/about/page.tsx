import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import PageHeader from "@/components/PageHeader/PageHeader";
import PageTabs from "@/components/PageTabs/PageTabs";
import ContactSection from "@/components/ContactSection/ContactSection";
import PartnersSection from "@/components/PartnersSection/PartnersSection";
import HistorySection from "@/components/HistorySection/HistorySection";
import ValuesSection from "@/components/ValuesSection/ValuesSection";

export const revalidate = 60;

export default async function AboutPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
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

  const tab = searchParams.tab || "nossa-historia";

  const tabs: { [key: string]: React.ReactElement } = {
    contato: <ContactSection content={contactInfo} />,
    "rede-colaboracao": <PartnersSection content={partnersInfo[0]} />,
    "nossa-historia": <HistorySection content={about[0]} />,
    "missao-visao-valor": <ValuesSection content={visionMissionValues} />,
  };

  return (
    <HubTemplate>
      <PageHeader
        content={pageHeaders.find(
          (section: { fields: { id: string } }) =>
            section.fields.id === "about",
        )}
      />
      <PageTabs content={pageTabs} />
      {tabs[tab]}
    </HubTemplate>
  );
}
