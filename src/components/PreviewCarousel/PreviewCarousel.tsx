"use client";
import Autoplay from "embla-carousel-autoplay";
import { IPreviewCard } from "@/utils/interfaces";
import PreviewCard from "@/components/PreviewCard/PreviewCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DotButton,
} from "../ui/carousel";

type Props = {
  cards: IPreviewCard[];
};

const PreviewCarousel = ({ cards }: Props) => {
  return (
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
      className="flex flex-col gap-2 content-carousel"
    >
      <CarouselContent className="-ml-0">
        {cards.map((card, i) => (
          <CarouselItem
            key={i}
            className="basis-1/1 md:basis-1/2 lg:basis-1/4 p-1 md:p-2"
          >
            <PreviewCard content={card} />
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="flex md:hidden gap-2 w-full justify-center">
        {cards.map((_, i) => (
          <DotButton tabIndex={i} key={i} />
        ))}
      </div>

      <CarouselPrevious className="hidden md:flex" />
      <CarouselNext className="hidden md:flex" />
    </Carousel>
  );
};

export default PreviewCarousel;
