"use client";
import { useState } from "react";
import Filter from "./Filter/Filter";
import { IPreviewCard, IPreviewCards } from "@/utils/interfaces";
import PreviewCard from "@/components/PreviewCard/PreviewCard";
import Carousel from "../Carousel/Carousel";
import {
  Card,
  Header,
  Logo,
  LogoContainer,
  Name,
  Wrapper,
} from "./PreviewSection.styles";

const PreviewSection = ({ cards }: { cards: IPreviewCards[] }) => {
  const [selectedRegion, setSelectedRegion] = useState("Nordeste");
  const [selectedState, setSelectedState] = useState("");

  const allCardsData = cards.map((card) => card.fields.jsonFile);

  const filteredCards = allCardsData.map((regionData) => {
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
        }
      : null;
  }) as IPreviewCard[];

  const handleFilterChange = (region: string, state: string) => {
    setSelectedRegion(region);
    setSelectedState(state);
  };

  const carouselConfig = {
    perView: filteredCards.length > 4 ? 4 : filteredCards.length,
    type: "carousel",
    gap: 16,
    autoplay: 5000,
    bound: true,
    breakpoints: {
      1250: {
        perView: filteredCards.length > 4 ? 4 : filteredCards.length,
      },
      1000: {
        perView: filteredCards.length > 3 ? 3 : filteredCards.length,
      },
      860: {
        perView: filteredCards.length > 2 ? 2 : filteredCards.length,
      },
      650: {
        perView: 1,
      },
    },
  };

  return (
    <Wrapper>
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

      {filteredCards.length > 0 && (
        <Carousel
          key={`${selectedRegion}-${selectedState}`}
          classname="out-control"
          config={carouselConfig}
        >
          {filteredCards.map((card, i) => (
            <Card className="glide__slide" key={i}>
              <PreviewCard content={card} />
            </Card>
          ))}
        </Carousel>
      )}
    </Wrapper>
  );
};

export default PreviewSection;
