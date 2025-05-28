import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const FILTERS: {
  [key: string]: {
    filter: string;
    text: string;
    href: string;
    key: "all" | "panels" | "posts";
  };
} = {
  all: {
    filter: "data-panel,newsletter,additional-content",
    text: "Todos",
    href: "/",
    key: "all",
  },
  panels: {
    filter: "data-panel",
    text: "Painéis de dados",
    href: "/explore?page=1",
    key: "panels",
  },
  posts: {
    filter: "newsletter,additional-content",
    text: "Publicações",
    href: "/posts?page=1",
    key: "posts",
  },
};

export const TypeFilter = ({
  onChange,
}: {
  onChange: (value: "all" | "panels" | "posts") => void;
}) => {
  return (
    <RadioGroup
      defaultValue={FILTERS.all.key}
      className="w-full flex gap-4"
      onValueChange={onChange}
    >
      {Object.entries(FILTERS).map(([key, { text }]) => {
        return (
          <div className="flex items-center space-x-2" key={key}>
            <RadioGroupItem value={key} id={key} />
            <Label htmlFor={key}>{text}</Label>
          </div>
        );
      })}
    </RadioGroup>
  );
};
