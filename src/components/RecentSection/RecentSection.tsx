import { IPublication } from "@/utils/interfaces";
import Carousel from "../Carousel/Carousel";
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

export const RecentSection = ({
  header,
  content,
}: {
  header: { fields: any };
  content: { fields: IPublication }[];
}) => {
  const { id, title, subtitle } = header.fields;

  return (
    <Wrapper id={id}>
      <HeaderWrapper>
        <Header>
          <Title href="/posts">
            {title} <RightIcon id="expand" size={14} />
          </Title>
          <Button href="/posts">Ver todos</Button>
        </Header>
        <Subtitle>{subtitle}</Subtitle>
      </HeaderWrapper>
      <ContentWrapper>
        <Carousel cards={content} />
      </ContentWrapper>
    </Wrapper>
  );
};
