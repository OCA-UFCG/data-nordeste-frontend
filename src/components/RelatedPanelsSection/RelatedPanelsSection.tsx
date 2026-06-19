"use client";

import { SearchResultCard } from "@/components/SearchResultCard/SearchResultCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DotButton,
} from "@/components/ui/carousel";
import type { SearchResult } from "@/features/search/types";

type RelatedPanelsSectionProps = {
  items: SearchResult[];
};

export const RelatedPanelsSection = ({ items }: RelatedPanelsSectionProps) => {
  if (!items.length) return null;

  return (
    <section className="w-full bg-white py-10">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-20">
        <h2 className="text-[30px] font-semibold leading-[36px] text-[#292829]">
          Conteúdo Relacionado
        </h2>
        <RelatedPanelsCarousel items={items} />
      </div>
    </section>
  );
};

const RelatedPanelsCarousel = ({ items }: RelatedPanelsSectionProps) => (
  <Carousel
    opts={{ align: "start", loop: items.length > 1 }}
    className="w-full"
  >
    <CarouselContent className="-ml-0">
      {items.map((item) => (
        <CarouselItem key={item.id} className={relatedPanelItemClassName}>
          <SearchResultCard result={item} />
        </CarouselItem>
      ))}
    </CarouselContent>
    <RelatedPanelsMobileDots items={items} />
    <CarouselPrevious className="hidden md:flex" />
    <CarouselNext className="hidden md:flex" />
  </Carousel>
);

const RelatedPanelsMobileDots = ({ items }: RelatedPanelsSectionProps) => (
  <div className="flex w-full justify-center gap-2 md:hidden">
    {items.map((item, index) => (
      <DotButton key={item.id} tabIndex={index} />
    ))}
  </div>
);

const relatedPanelItemClassName =
  "basis-1/1 p-0 md:basis-1/2 md:p-2 lg:basis-1/3 xl:basis-1/4";
