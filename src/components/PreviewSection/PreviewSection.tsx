"use client";
import { useMemo, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { IPreviewCard, IPreviewCards } from "@/utils/interfaces";
import PreviewCard from "@/components/PreviewCard/PreviewCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DotButton,
} from "../ui/carousel";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const PreviewSection = ({
  header,
  cards,
}: {
  cards: IPreviewCards[];
  header: { fields: any };
}) => {
  const [selectedState, setSelectedState] = useState("all");

  const allCardsData = cards.map((card) => ({
    category: card.fields.category,
    ...card.fields.jsonFile,
  }));

  const filteredCards = useMemo(() => {
    return allCardsData.map((regionData) => {
      const source =
        selectedState !== "all"
          ? regionData.states.find((state) => state.name === selectedState)
          : regionData;

      return source
        ? {
            title: regionData.title,
            subtitle: regionData.subtitle,
            data: source.data,
            link: source.link,
            note: source.note,
            category: regionData.category,
          }
        : null;
    }) as IPreviewCard[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]);

  const handleFilterChange = (state: string) => {
    // setSelectedRegion(region);
    setSelectedState(state);
  };

  return (
    <div className="flex flex-col bg-white px-8 gap-3 py-10 max-w-[1440px] w-full justify-center items-center shadow-md rounded-lg -translate-y-4 lg:-translate-y-8">
      <div className="flex justify-between w-full">
        <h2 className="text-3xl font-semibold">{header.fields.title}</h2>
        <Select onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Nordeste" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Nordeste</SelectItem>
            <SelectGroup>
              <SelectLabel>Estados</SelectLabel>
              {allCardsData &&
                allCardsData[0].states.map((state, i) => (
                  <SelectItem value={state.name} key={i}>
                    {state.name}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

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
          {filteredCards.map((card, i) => (
            <CarouselItem
              key={i}
              className="basis-1/1 md:basis-1/2 lg:basis-1/4 p-2"
            >
              <PreviewCard content={card} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex md:hidden gap-2 w-full justify-center">
          {filteredCards.map((_, i) => (
            <DotButton tabIndex={i} key={i} />
          ))}
        </div>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};

export default PreviewSection;
