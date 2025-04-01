import { IPublication } from "@/utils/interfaces";
import Carousel from "../Carousel/Carousel";
import {
  Button,
  Card,
  ContentWrapper,
  HeaderWrapper,
  RightIcon,
  Subtitle,
  Title,
  Wrapper,
} from "./RecentSection.styles";
import { Header } from "./RecentSection.styles";
import ContentPost from "../ContentPost/ContentPost";

export const RecentSection = ({
  header,
  content,
}: {
  header: { fields: any };
  content: { fields: IPublication }[];
}) => {
  const { id, title, subtitle } = header.fields;

  const carouselConfig = {
    perView: content.length > 4 ? 4 : content.length,
    gap: 16,
    autoplay: 50000,
    bound: true,
    breakpoints: {
      1200: {
        perView: content.length > 4 ? 4 : content.length,
      },
      1000: {
        perView: content.length > 2 ? 2 : content.length,
      },
      800: {
        perView: content.length > 2 ? 2 : content.length,
      },
      600: {
        perView: 1,
      },
    },
  };

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
        <Carousel config={carouselConfig}>
          {content
            .sort(
              (a, b) =>
                new Date(b.fields.date).getTime() -
                new Date(a.fields.date).getTime(),
            )
            .map((card, i) => (
              <Card className="glide__slide" key={i}>
                <ContentPost content={card} />
              </Card>
            ))}
        </Carousel>
      </ContentWrapper>
    </Wrapper>
  );
};
