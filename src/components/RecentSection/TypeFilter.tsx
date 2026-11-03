import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PostType } from "@/features/posts/postTypes";
import {
  RECENT_TAB_POST_TYPES,
  type RecentFilterKey,
} from "@/features/home/recentTabs";

export type { RecentFilterKey };

export const FILTERS: {
  [key in RecentFilterKey]: {
    filter: PostType[];
    text: string;
    href: string;
    key: RecentFilterKey;
  };
} = {
  all: {
    filter: RECENT_TAB_POST_TYPES.all,
    text: "Todos",
    href: "/explore?page=1",
    key: "all",
  },
  panels: {
    filter: RECENT_TAB_POST_TYPES.panels,
    text: "Painéis",
    href: "/explore?page=1",
    key: "panels",
  },
  stories: {
    filter: RECENT_TAB_POST_TYPES.stories,
    text: "Narrativas",
    href: "/posts?type_in=data-story&page=1",
    key: "stories",
  },
  newsletters: {
    filter: RECENT_TAB_POST_TYPES.newsletters,
    text: "Boletins",
    href: "/posts?type_in=newsletter&page=1",
    key: "newsletters",
  },
  publications: {
    filter: RECENT_TAB_POST_TYPES.publications,
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
  const filterVisibility = {
    all: "flex",
    panels: "flex",
    stories: "hidden md:flex",
    newsletters: "hidden md:flex",
    publications: "flex md:hidden",
  } satisfies Record<RecentFilterKey, string>;

  return (
    <RadioGroup
      defaultValue={FILTERS.all.key}
      className="flex w-full justify-start gap-6"
      onValueChange={onChange}
    >
      {(Object.keys(FILTERS) as RecentFilterKey[]).map((key) => (
        <div
          className={`${filterVisibility[key]} items-center gap-2`}
          key={key}
        >
          <RadioGroupItem
            value={key}
            id={`recent-${key}`}
            className="border-green-900 hover:border-green-900 focus-visible:border-green-900 data-[state=checked]:border-green-800"
          />
          <Label htmlFor={`recent-${key}`} className="font-normal">
            {FILTERS[key].text}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
