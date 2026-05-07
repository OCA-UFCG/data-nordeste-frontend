import { sortingTypes } from "@/utils/constants";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export const SortSelect = ({
  onChange,
  defaultValue,
  sortingTypes: customSortingTypes,
}: {
  defaultValue: string;
  onChange: (value: string) => void;
  sortingTypes?: { [key: string]: string };
}) => {
  const types = customSortingTypes || sortingTypes;

  return (
    <Select value={defaultValue} onValueChange={onChange}>
      <SelectTrigger className="w-full lg:w-fit hover:bg-grey-100 cursor-pointer">
        <SelectValue placeholder="Ordenar por" defaultValue={defaultValue} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {Object.entries(types).map(([key, value]) => (
            <SelectItem value={value} key={value} className="cursor-pointer">
              {key}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
