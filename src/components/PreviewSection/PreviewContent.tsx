"use client";
import { useMemo, useState } from "react";
import { IPreviewCard, IPreviewCards, SectionHeader } from "@/utils/interfaces";
import PreviewCarousel from "@/components/PreviewCarousel/PreviewCarousel";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface PreviewContentProps {
  header?: SectionHeader;
  cards: IPreviewCards[];
}

const PreviewContent = ({ header, cards }: PreviewContentProps) => {
  const [selectedState, setSelectedState] = useState("all");

  const allCardsData = cards.map((card) => ({
    category: card.category,
    ...card.jsonFile,
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
    setSelectedState(state);
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-3 justify-between w-full">
        <h2 className="text-3xl font-semibold">{header?.title}</h2>
        <Select onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full lg:w-[180px]">
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
      {/* Carousel separado */}
      <PreviewCarousel cards={filteredCards} />
    </>
  );
};

export default PreviewContent;