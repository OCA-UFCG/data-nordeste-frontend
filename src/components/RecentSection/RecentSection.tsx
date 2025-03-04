import { Carousel } from "../Carousel/Carousel";
import {
  Button,
  ContentWrapper,
  HeaderWrapper,
  RightIcon,
  Subtitle,
  Title,
  Wrapper,
} from "./RecentSection.styles";
import { Header } from "./RecentSection.styles";

export const RecentSection = ({ header }: { header: { fields: any } }) => {
  const { id, title, subtitle } = header.fields;

  return (
    <Wrapper id={id}>
      <HeaderWrapper>
        <Header>
          <Title href="#new">
            {title} <RightIcon id="expand" size={14} />
          </Title>
          <Button href="#new">Ver todos</Button>
        </Header>
        <Subtitle>{subtitle}</Subtitle>
      </HeaderWrapper>
      <ContentWrapper>
        <Carousel />
      </ContentWrapper>
    </Wrapper>
  );
};
