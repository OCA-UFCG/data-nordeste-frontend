import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import PageHeader from "@/components/PageHeader/PageHeader";
import AboutBigCard from "@/components/AboutBigCard/AboutBigCard";
import PageTabs from "@/components/PageTabs/PageTabs";
import { Suspense } from "react";
import GalleryCarousel from "@/components/GalleryCarousel/GalleryCarousel";
import ContactSection from "@/components/ContactSection/ContactSection";
import ValuesSection from "@/components/ValuesSection/ValuesSection";

export const revalidate = 60;

export default async function AboutPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const { pageHeaders, pageTabs, about, contactInfo, visionMissionValues } =
    await getContent([
      "pageHeaders",
      "pageTabs",
      "about",
      "contactInfo",
      "visionMissionValues",
    ]);

  const tab = searchParams.tab || "nossa-historia";

  const tabs: { [key: string]: React.ReactElement } = {
    contato: <ContactSection content={contactInfo} />,
    "nossa-historia": (
      <Suspense fallback={<></>}>
        <AboutBigCard content={pageTabs} about={about[0]} />
        <GalleryCarousel album={about[0].fields.album} />
      </Suspense>
    ),
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
