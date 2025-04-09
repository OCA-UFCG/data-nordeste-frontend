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
  const regions = Array.from(new Set(data.map((card) => card.region)));

  const getRegionStates = (region: string) => {
    const regionCard = data.find((card) => card.region === region);

    return regionCard ? regionCard.states : [];
  };

  return (
    <FilterWrapper>
      <FilterHeader>
        <Title>{selectedState || selectedRegion}</Title>
        <Expand id="expand" size={10} />
      </FilterHeader>

      <FilterContent>
        <FilterList>
          {regions.map((region) => (
            <li key={region}>
              <RegionTitle onClick={() => onChange(region, "")}>
                {region}
              </RegionTitle>

              <ul>
                {getRegionStates(region).map((state) => (
                  <StateItem
                    key={state.name}
                    onClick={() => onChange(region, state.name)}
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
