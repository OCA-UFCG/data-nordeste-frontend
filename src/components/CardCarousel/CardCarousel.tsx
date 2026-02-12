"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DotButton,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import ContentPost from "@/components/ContentPost/ContentPost";
import PreviewCard from "@/components/PreviewCard/PreviewCard";
import { IPublication, IPreviewCard } from "@/utils/interfaces";

type PostCarouselProps = {
  variant: "post";
  items: IPublication[];
};

type PreviewCarouselProps = {
  variant: "preview";
  items: IPreviewCard[];
};

type Props = PostCarouselProps | PreviewCarouselProps;

export function CardCarousel({ variant, items }: Props) {
  const sortedItems =
    variant === "post"
      ? [...items].sort(
          (a, b) =>
            new Date((b as IPublication).date).getTime() -
            new Date((a as IPublication).date).getTime(),
        )
      : items;

  const itemClassName =
    variant === "post"
      ? "basis-1/1 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 p-0 md:p-2"
      : "basis-1/1 md:basis-1/2 lg:basis-1/4 p-1 md:p-2";

  return (
    <div className="flex justify-center">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 10000,
          }),
        ]}
        className="flex flex-col gap-4 content-carousel"
      >
        <CarouselContent className="-ml-0">
          {sortedItems.map((item, i) => (
            <CarouselItem key={i} className={itemClassName}>
              {variant === "post" ? (
                <ContentPost content={item as IPublication} />
              ) : (
                <PreviewCard content={item as IPreviewCard} />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="flex md:hidden gap-2 w-full justify-center">
          {sortedItems.map((_, i) => (
            <DotButton tabIndex={i} key={i} />
          ))}
        </div>

        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
}
