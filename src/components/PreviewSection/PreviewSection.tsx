"use client";
import { useMemo, useState } from "react";
import { IPreviewCard, IPreviewCards, SectionHeader } from "@/utils/interfaces";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CardCarousel } from "../CardCarousel/CardCarousel";

const PreviewSection = ({
  header,
  cards,
}: {
  cards: IPreviewCards[];
  header?: SectionHeader;
}) => {
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
    <section className="w-full bg-white">
      <div className="w-full max-w-[1440px] mx-auto px-3 lg:px-20">
        <div
          className="flex flex-col w-full bg-white gap-3 box-border py-5 px-3 lg:px-6 py-10 
                 justify-center items-center shadow-md rounded-lg 
                 -translate-y-4 lg:-translate-y-12"
        >
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
          <CardCarousel items={filteredCards} variant="preview" />
        </div>
      </div>
    </section>
  );
};

export default PreviewSection;
