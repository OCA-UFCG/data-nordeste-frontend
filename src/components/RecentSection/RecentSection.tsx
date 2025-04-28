import { IPublication } from "@/utils/interfaces";
import Carousel from "../Carousel/Carousel";
import {
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
import { LinkButton } from "../LinkButton/LinkButton";

export const RecentSection = ({
  header,
  content,
}: {
  header: { fields: any };
  content: { fields: IPublication }[];
}) => {
  const { id, title, subtitle } = header.fields;

  const carouselConfig = {
    perView: content.length > 3 ? 3 : content.length,
    gap: 16,
    autoplay: 5000,
    bound: true,
    breakpoints: {
      1300: {
        perView: content.length > 3 ? 3 : content.length,
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
          <div className="hidden md:block">
            <LinkButton href="/posts" text="Ver Todos" variant="secondary" />
          </div>
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
        <div className="block md:hidden mt-6 flex justify-center w-full">
          <LinkButton href="/posts" text="Ver Todos" variant="secondary" />
        </div>
      </ContentWrapper>
    </Wrapper>
  );
};
