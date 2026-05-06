import {
  IPreviewCard,
  IPreviewCards,
  IStateData,
  SectionHeader,
} from "@/utils/interfaces";

export const findHomeSection = (
  sections: SectionHeader[],
  id: string,
): SectionHeader | undefined => {
  return sections.find((section) => section.id === id);
};

type PreviewIconFields = {
  icon?: unknown;
  icons?: unknown;
  iconsvg?: IPreviewCard["iconsvg"];
  icon_svg?: IPreviewCard["iconsvg"];
  iconUrl?: unknown;
  iconurl?: unknown;
  icon_url?: unknown;
};

type PreviewCardJson = IPreviewCards["jsonFile"] & PreviewIconFields;
type PreviewState = IStateData & PreviewIconFields;

export type NormalizedPreviewRegion = IPreviewCard &
  PreviewIconFields & {
    states: PreviewState[];
  };

const firstDefined = <T>(...values: (T | undefined)[]): T | undefined => {
  return values.find((value) => value !== undefined);
};

export const normalizePreviewCards = (
  cards: IPreviewCards[],
): NormalizedPreviewRegion[] => {
  return cards.map((card) => {
    const cardIcons = card as IPreviewCards & PreviewIconFields;
    const json = (card.jsonFile ?? {}) as PreviewCardJson;
    const normalizedStates = (json.states ?? []).map((state) => {
      const stateData = state as PreviewState;

      return {
        ...stateData,
        icon: firstDefined(stateData.icon, stateData.icons),
        iconsvg: firstDefined(stateData.iconsvg, stateData.icon_svg),
        iconUrl: firstDefined(
          stateData.iconUrl,
          stateData.iconurl,
          stateData.icon_url,
        ),
      };
    });

    return {
      category: card.category,
      title: json.title,
      subtitle: json.subtitle,
      data: json.data,
      link: json.link,
      note: json.note,
      states: normalizedStates,
      icon: firstDefined(
        cardIcons.icon,
        cardIcons.icons,
        json.icon,
        json.icons,
      ),
      iconsvg: firstDefined(cardIcons.iconsvg, json.iconsvg),
      iconUrl: firstDefined(
        cardIcons.iconUrl,
        cardIcons.iconurl,
        json.iconUrl,
        json.iconurl,
        json.icon_url,
      ),
    };
  });
};

export const getPreviewStates = (
  regions: NormalizedPreviewRegion[],
): IStateData[] => {
  return regions[0]?.states ?? [];
};

export const getFilteredPreviewCards = (
  regions: NormalizedPreviewRegion[],
  selectedState: string,
): IPreviewCard[] => {
  return regions.flatMap((regionData) => {
    const foundState = regionData.states.find(
      (state) => state.name === selectedState,
    );
    const source = selectedState !== "all" ? foundState : regionData;
    const stateSource =
      selectedState !== "all" ? foundState : regionData.states[0];

    if (!source) return [];

    return [
      {
        title: regionData.title,
        subtitle: regionData.subtitle,
        data: source.data,
        link: source.link,
        note: source.note,
        category: regionData.category,
        iconsvg: firstDefined(stateSource?.iconsvg, regionData.iconsvg),
      },
    ];
  });
};
