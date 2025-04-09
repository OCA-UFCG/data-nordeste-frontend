import React from "react";
import {
  Expand,
  FilterContent,
  FilterHeader,
  FilterList,
  FilterWrapper,
  RegionTitle,
  StateItem,
  Title,
} from "./Filter.styles";
import { IRegionData } from "@/utils/interfaces";

const Filter = ({
  data,
  selectedRegion,
  selectedState,
  onChange,
}: {
  data: IRegionData[];
  selectedRegion: string;
  selectedState: string;
  onChange: (region: string, state: string) => void;
}) => {
  return (
    <FilterWrapper>
      <FilterHeader>
        <Title>{selectedState || selectedRegion}</Title>
        <Expand id="expand" size={10} />
      </FilterHeader>

      <FilterContent>
        <FilterList>
          {data.map((regionItem) => (
            <li key={regionItem.region}>
              <RegionTitle onClick={() => onChange(regionItem.region, "")}>
                {regionItem.region}
              </RegionTitle>

              <ul>
                {regionItem.states.map((state) => (
                  <StateItem
                    key={state.name}
                    onClick={() => onChange(regionItem.region, state.name)}
                  >
                    {state.name}
                  </StateItem>
                ))}
              </ul>
            </li>
          ))}
        </FilterList>
      </FilterContent>
    </FilterWrapper>
  );
};
export default Filter;
