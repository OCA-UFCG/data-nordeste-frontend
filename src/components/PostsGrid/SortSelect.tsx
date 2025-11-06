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
  defaultvalue,
  sortingTypes: customSortingTypes,
}: {
  defaultvalue: string;
  onChange: (value: string) => void;
  sortingTypes?: { [key: string]: string };
}) => {
  const types = customSortingTypes || sortingTypes;

  return (
    <Select value={defaultvalue} onValueChange={onChange}>
      <SelectTrigger className="w-full lg:w-fit hover:bg-grey-100 cursor-pointer">
        <SelectValue placeholder="Ordenar por" defaultValue={defaultvalue} />
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
