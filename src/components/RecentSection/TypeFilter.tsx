import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  RECENT_NEWSLETTER_POST_TYPES,
  RECENT_PANEL_POST_TYPES,
  RECENT_SECTION_POST_TYPES,
  RECENT_STORY_POST_TYPES,
  PostType,
} from "@/features/posts/postTypes";

export type RecentFilterKey =
  | "all"
  | "panels"
  | "stories"
  | "newsletters"
  | "publications";

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
    href: "/explore?page=1",
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
  publications: {
    filter: [...RECENT_STORY_POST_TYPES, ...RECENT_NEWSLETTER_POST_TYPES],
    text: "Publicações",
    href: "/posts?page=1",
    key: "publications",
  },
};

export const TypeFilter = ({
  onChange,
}: {
  onChange: (value: RecentFilterKey) => void;
}) => {
  return (
    <>
      <RadioGroup
        defaultValue={FILTERS.all.key}
        className="hidden w-full gap-6 md:flex"
        onValueChange={onChange}
      >
        {(["all", "panels", "stories", "newsletters"] as const).map((key) => (
          <div className="flex items-center gap-2" key={key}>
            <RadioGroupItem
              value={key}
              id={`desktop-${key}`}
              className="border-green-900 hover:border-green-900 focus-visible:border-green-900 data-[state=checked]:border-green-800"
            />
            <Label htmlFor={`desktop-${key}`} className="font-normal">
              {FILTERS[key].text}
            </Label>
          </div>
        ))}
      </RadioGroup>

      <RadioGroup
        defaultValue={FILTERS.all.key}
        className="flex w-full justify-start gap-6 md:hidden"
        onValueChange={onChange}
      >
        {(["all", "panels", "publications"] as const).map((key) => (
          <div className="flex items-center gap-2" key={key}>
            <RadioGroupItem
              value={key}
              id={`mobile-${key}`}
              className="border-green-900 hover:border-green-900 focus-visible:border-green-900 data-[state=checked]:border-green-800"
            />
            <Label htmlFor={`mobile-${key}`} className="font-normal">
              {FILTERS[key].text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </>
  );
};
