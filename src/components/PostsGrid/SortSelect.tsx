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
}: {
  defaultvalue: string;
  onChange: (value: string) => void;
}) => {
  return (
    <Select onValueChange={onChange}>
      <SelectTrigger className="w-full lg:w-fit hover:bg-grey-100 cursor-pointer">
        <SelectValue placeholder="Ordenar por" defaultValue={defaultvalue} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {Object.entries(sortingTypes).map(([key, value]) => (
            <SelectItem value={value} key={key} className="cursor-pointer">
              {key}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
