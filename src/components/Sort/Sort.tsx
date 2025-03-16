import { useState } from "react";
import {
  SortContainer,
  SortOptions,
  SortOption,
  ExpandIcon,
  SortDetails,
  Summary,
  OrderIcon,
  Wrapper,
} from "./Sort.styles";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

const Sort = () => {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value.replace("fields.", ""));
    router?.push(`${pathname}?${params.toString()}`);
  };

  const sortOptions = [
    { label: "A-Z", value: "fields.title" },
    { label: "Z-A", value: "-fields.title" },
    { label: "Data de publicação", value: "-fields.date" },
  ];

  return (
    <SortContainer>
      <SortDetails onClick={() => setIsOpen(!isOpen)}>
        <Summary>
          <OrderIcon id="order-icon" size={16} />
          {"Ordenar por"}
          <ExpandIcon id="expand" size={10} isOpen={isOpen} />
        </Summary>
        <Wrapper>
          <SortOptions isOpen={isOpen}>
            {sortOptions.map((option) => (
              <SortOption
                key={option.value}
                onClick={() => handleSortChange(option.value)}
              >
                {option.label}
              </SortOption>
            ))}
          </SortOptions>
        </Wrapper>
      </SortDetails>
    </SortContainer>
  );
};

export default Sort;
