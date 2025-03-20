import { sortingTypes } from "@/utils/constants";
import { Icon } from "../Icon/Icon";
import {
  Content,
  ContentItem,
  ContentWrapper,
  Expand,
  Header,
  Text,
  TextContainer,
  Wrapper,
} from "./SortMenu.styles";

export const SortMenu = ({ onClick }: { onClick: (type: string) => void }) => {
  return (
    <Wrapper>
      <Header>
        <Icon id="order" size={16} />
        <TextContainer>
          <Text>Ordernar por</Text>
          <Expand id="expand" width={12} height={6} />
        </TextContainer>
      </Header>
      <Content>
        <ContentWrapper>
          {Object.keys(sortingTypes).map((type) => (
            <ContentItem onClick={() => onClick(type)} key={type}>
              {type}
            </ContentItem>
          ))}
        </ContentWrapper>
      </Content>
    </Wrapper>
  );
};
