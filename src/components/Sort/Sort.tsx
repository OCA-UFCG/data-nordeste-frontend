import { useEffect, useState } from "react";
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
import { useSearchParams, usePathname, useRouter, notFound } from "next/navigation";

const Sort = () => {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router?.push(`${pathname}?${params.toString()}`);
  };

  const sortOptions = [
    { label: "A-Z", value: "title" },
    { label: "Z-A", value: "-title" },
    { label: "Data de publicação", value: "-date" },
  ];
  
  const sortParam = searchParams.get("sort");
  useEffect(() => {
    const isValidSort = sortOptions.some(option => option.value === sortParam);
    
    if (sortParam && !isValidSort) {
      notFound();
    }
  }, [sortParam]);
  
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
