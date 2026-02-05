"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DotButton,
} from "../../components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import ContentPost from "@/components/ContentPost/ContentPost";
import { IPublication } from "@/utils/interfaces";

type Props = {
  posts: IPublication[];
};

export function PostCarousel({ posts }: Props) {
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
          {posts
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .map((card, i) => (
              <CarouselItem
                key={i}
                className="basis-1/1 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 p-0 md:p-2"
              >
                <ContentPost content={card} key={i} />
              </CarouselItem>
            ))}
        </CarouselContent>
        <div className="flex md:hidden gap-2 w-full justify-center">
          {posts.map((_, i) => (
            <DotButton tabIndex={i} key={i} />
          ))}
        </div>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
}
