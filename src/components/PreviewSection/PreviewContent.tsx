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

interface PreviewContentProps {
  header?: SectionHeader;
  cards: IPreviewCards[];
}

const PreviewContent = ({ header, cards }: PreviewContentProps) => {
  const [selectedState, setSelectedState] = useState("all");

  const allCardsData = cards.map((card) => {
    const json = (card as any).jsonFile ?? {};

    const normalizedStates = (json.states ?? []).map((s: any) => ({
      ...s,
      icon: s.icon ?? s.icons ?? s.iconsvg ?? undefined,
      iconsvg: s.iconsvg ?? s.iconsvg ?? s.icon_svg ?? undefined,
      iconUrl: s.iconUrl ?? s.iconurl ?? s.icon_url ?? undefined,
    }));

    return {
      category: card.category,
      ...json,
      states: normalizedStates,
      icon: (card as any).icon ?? (card as any).icons ?? json.icon ?? undefined,
      iconsvg:
        (card as any).iconsvg ??
        (card as any).iconsvg ??
        json.iconsvg ??
        json.iconsvg ??
        undefined,
      iconUrl:
        (card as any).iconUrl ??
        (card as any).iconurl ??
        json.iconUrl ??
        json.iconurl ??
        undefined,
    } as any;
  });

  const filteredCards = useMemo(() => {
    return allCardsData.map((regionData) => {
      const foundState = regionData.states?.find(
        (state: any) => state.name === selectedState,
      );
      const source = selectedState !== "all" ? foundState : regionData;

      const stateSource =
        selectedState !== "all" ? foundState : regionData.states?.[0];

      return source
        ? {
            title: regionData.title,
            subtitle: regionData.subtitle,
            data: source.data,
            link: source.link,
            note: source.note,
            category: regionData.category,
            icon:
              (stateSource as any)?.icon ??
              (regionData as any).icon ??
              undefined,
            iconsvg:
              (stateSource as any)?.iconsvg ??
              (regionData as any).iconsvg ??
              undefined,
            iconUrl:
              (stateSource as any)?.iconUrl ??
              (regionData as any).iconUrl ??
              undefined,
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
                allCardsData[0].states.map((state: any, i: number) => (
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
