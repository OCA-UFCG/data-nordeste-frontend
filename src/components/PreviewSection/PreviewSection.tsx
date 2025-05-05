"use client";
import { useMemo, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { IPreviewCard, IPreviewCards } from "@/utils/interfaces";
import PreviewCard from "@/components/PreviewCard/PreviewCard";
import { Header, Logo, LogoContainer, Name } from "./PreviewSection.styles";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DotButton,
} from "../ui/carousel";
import Filter from "./Filter/Filter";

const PreviewSection = ({ cards }: { cards: IPreviewCards[] }) => {
  const [selectedRegion, setSelectedRegion] = useState("Nordeste");
  const [selectedState, setSelectedState] = useState("");

  const allCardsData = cards.map((card) => ({
    category: card.fields.category,
    ...card.fields.jsonFile,
  }));

  const filteredCards = useMemo(() => {
    return allCardsData.map((regionData) => {
      const source = selectedState
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
  }, [selectedState, selectedRegion]);

  const handleFilterChange = (region: string, state: string) => {
    setSelectedRegion(region);
    setSelectedState(state);
  };

  return (
    <div className="flex flex-col p-6 max-w-[1440px] w-full justify-center items-center">
      <Header>
        <LogoContainer>
          <Logo src="/logo.png" alt="datane logo" width={24} height={24} />
          <Name>Data Nordeste</Name>
        </LogoContainer>

        <Filter
          data={allCardsData}
          selectedRegion={selectedRegion}
          selectedState={selectedState}
          onChange={handleFilterChange}
        />
      </Header>

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
