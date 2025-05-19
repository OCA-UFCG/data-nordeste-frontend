import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import PageHeader from "@/components/PageHeader/PageHeader";
import AboutBigCard from "@/components/AboutBigCard/AboutBigCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import PageTabs from "@/components/PageTabs/PageTabs";
import { Suspense } from "react";

export const revalidate = 60;

export default async function AboutPage({}: {}) {
  const { pageHeaders, pageTabs, about } = await getContent([
    "pageHeaders",
    "pageTabs",
    "about",
  ]);

  return (
    <HubTemplate>
      <PageHeader
        content={pageHeaders.find(
          (section: { fields: { id: string } }) =>
            section.fields.id === "about",
        )}
      />
      <Suspense fallback={<></>}>
        <PageTabs content={pageTabs} />
      </Suspense>
      <AboutBigCard about={about[0]} />
      <div className="w-full px-6 pt-9 lg:px-20 lg:pt-12 pb-9">
        <h2 className="text-green-900 text-2xl font-semibold mb-4">Galeria</h2>
        <div className="flex justify-center">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="flex flex-col gap-4 content-carousel"
          >
            <CarouselContent className="-ml-0">
              {(about[0].fields.album as any[]).map(
                (photo: any, index: number) => (
                  <CarouselItem
                    key={index}
                    className="basis-1/1 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 p-0 md:p-2"
                  >
                    <Image
                      width={250}
                      height={250}
                      alt=""
                      src={`https:${photo?.fields?.file.url || ""}`}
                      className="w-full max-h-[250px] rounded-lg aspect-1/1 block object-cover object-top transition-transform group-hover:scale-102 duration-300"
                    />
                  </CarouselItem>
                ),
              )}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </HubTemplate>
  );
}
