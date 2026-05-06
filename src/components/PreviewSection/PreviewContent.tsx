"use client";
import { useMemo, useState } from "react";
import { IPreviewCards, SectionHeader } from "@/utils/interfaces";
import {
  getFilteredPreviewCards,
  getPreviewStates,
  normalizePreviewCards,
} from "@/features/home/content";
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

interface PreviewContentProps {
  header?: SectionHeader;
  cards: IPreviewCards[];
}

const PreviewContent = ({ header, cards }: PreviewContentProps) => {
  const [selectedState, setSelectedState] = useState("all");

  const allCardsData = useMemo(() => normalizePreviewCards(cards), [cards]);
  const states = getPreviewStates(allCardsData);

  const filteredCards = useMemo(() => {
    return getFilteredPreviewCards(allCardsData, selectedState);
  }, [allCardsData, selectedState]);

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
              {states.map((state, i) => (
                <SelectItem value={state.name} key={i}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <CardCarousel items={filteredCards} variant="preview" />
    </>
  );
};

export default PreviewContent;
