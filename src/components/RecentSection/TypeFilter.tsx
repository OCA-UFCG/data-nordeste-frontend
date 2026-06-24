import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  RECENT_NEWSLETTER_POST_TYPES,
  RECENT_PANEL_POST_TYPES,
  RECENT_SECTION_POST_TYPES,
  RECENT_STORY_POST_TYPES,
  PostType,
} from "@/features/posts/postTypes";

export type RecentFilterKey = "all" | "panels" | "stories" | "newsletters";

export const FILTERS: {
  [key in RecentFilterKey]: {
    filter: PostType[];
    text: string;
    href: string;
    key: RecentFilterKey;
  };
} = {
  all: {
    filter: RECENT_SECTION_POST_TYPES,
    text: "Todos",
    href: "/",
    key: "all",
  },
  panels: {
    filter: RECENT_PANEL_POST_TYPES,
    text: "Painéis",
    href: "/explore?page=1",
    key: "panels",
  },
  stories: {
    filter: RECENT_STORY_POST_TYPES,
    text: "Narrativas",
    href: "/posts?type_in=data-story&page=1",
    key: "stories",
  },
  newsletters: {
    filter: RECENT_NEWSLETTER_POST_TYPES,
    text: "Boletins",
    href: "/posts?type_in=newsletter&page=1",
    key: "newsletters",
  },
};

export const TypeFilter = ({
  onChange,
}: {
  onChange: (value: RecentFilterKey) => void;
}) => {
  return (
    <RadioGroup
      defaultValue={FILTERS.all.key}
      className="w-full flex gap-4 "
      onValueChange={onChange}
    >
      {Object.entries(FILTERS).map(([key, { text }]) => {
        return (
          <div className="flex items-center space-x-2" key={key}>
            <RadioGroupItem
              value={key}
              id={key}
              className="border-green-900 hover:border-green-900 focus-visible:border-green-900 data-[state=checked]:border-green-800"
            />
            <Label htmlFor={key}>{text}</Label>
          </div>
        );
      })}
    </RadioGroup>
  );
};
