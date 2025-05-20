import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import PageHeader from "@/components/PageHeader/PageHeader";
import AboutBigCard from "@/components/AboutBigCard/AboutBigCard";
import PageTabs from "@/components/PageTabs/PageTabs";
import { Suspense } from "react";
import GalleryCarousel from "@/components/GalleryCarousel/GalleryCarousel";

export const revalidate = 60;

export default async function AboutPage({}: {}) {
  const { pageHeaders, pageTabs, about } = await getContent([
    "pageHeaders",
    "pageTabs",
    "about",
  ]);

  return (
    <HubTemplate>
      <Suspense fallback={<></>}>
        <PageHeader
          content={pageHeaders.find(
            (section: { fields: { id: string } }) =>
              section.fields.id === "about",
          )}
        />
        <PageTabs content={pageTabs} />
        <AboutBigCard content={pageTabs} about={about[0]} />
        <GalleryCarousel album={about[0].fields.album} />
      </Suspense>
    </HubTemplate>
  );
}
