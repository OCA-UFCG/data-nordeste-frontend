import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import PageHeader from "@/components/PageHeader/PageHeader";
import AboutBigCard from "@/components/AboutBigCard/AboutBigCard";
import PageTabs from "@/components/PageTabs/PageTabs";
import { Suspense } from "react";
import GalleryCarousel from "@/components/GalleryCarousel/GalleryCarousel";
import ContactSection from "@/components/ContactSection/ContactSection";

export const revalidate = 60;

export default async function AboutPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const { pageHeaders, pageTabs, about } = await getContent([
    "pageHeaders",
    "pageTabs",
    "about",
  ]);

  const { tab } = searchParams;

  return (
    <HubTemplate>
      {tab === "contato" && (
        <>
          <PageHeader
            content={pageHeaders.find(
              (section: { fields: { id: string } }) =>
                section.fields.id === "about",
            )}
          />

          <PageTabs content={pageTabs} />
          <ContactSection />
        </>
      )}

      {(!tab || tab === "nossa-historia") && (
        <Suspense fallback={<></>}>
          <>
            <PageHeader
              content={pageHeaders.find(
                (section: { fields: { id: string } }) =>
                  section.fields.id === "about",
              )}
            />
            <PageTabs content={pageTabs} />
            <AboutBigCard content={pageTabs} about={about[0]} />
            <GalleryCarousel album={about[0].fields.album} />
          </>
        </Suspense>
      )}
    </HubTemplate>
  );
}
