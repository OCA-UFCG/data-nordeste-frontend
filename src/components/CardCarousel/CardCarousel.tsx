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
      ? "basis-[274px] shrink-0 grow-0 pl-0 md:basis-[298px] md:p-3 md:shrink-0 md:grow-0"
      : "basis-auto md:basis-1/2 lg:basis-1/4 p-1 md:p-2";

  const contentClassName =
    variant === "post"
      ? "ml-0 pl-6 md:ml-[-3px] md:pl-0 gap-6 md:gap-0"
      : "-ml-1 md:-ml-2";

  const contentWrapperClassName =
    variant === "post" ? "overflow-visible md:overflow-hidden" : "";

  const isPost = variant === "post";

  return (
    <div className="w-full min-w-0 lg:flex lg:justify-center">
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
        className="flex flex-col gap-4 content-carousel w-full"
      >
        <CarouselContent
          className={contentClassName}
          wrapperClassName={contentWrapperClassName}
        >
          {sortedItems.slice(0, 8).map((item, i) => (
            <CarouselItem key={i} className={itemClassName}>
              {isPost ? (
                <ContentPost content={item as IPublication} />
              ) : (
                <PreviewCard content={item as IPreviewCard} />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="flex gap-2 w-full justify-center">
          {sortedItems.slice(0, 8).map((_, i) => (
            <DotButton tabIndex={i} key={i} />
          ))}
        </div>

        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
}
