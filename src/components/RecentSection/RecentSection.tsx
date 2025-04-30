import { IPublication } from "@/utils/interfaces";
import Carousel from "../Carousel/Carousel";
import {
  ContentWrapper,
  HeaderWrapper,
  Subtitle,
  Title,
  Wrapper,
} from "./RecentSection.styles";
import { Header } from "./RecentSection.styles";
import ContentPost from "../ContentPost/ContentPost";
import { LinkButton } from "../LinkButton/LinkButton";
import { Icon } from "../Icon/Icon";

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
          <Title href="/posts">{title}</Title>
          <div className="hidden md:block">
            <LinkButton href="/posts" variant="secondary">
              Ver Todos
              <Icon
                id="expand"
                className="transform -rotate-90 !w-[8px] !h-[8px]"
              />
            </LinkButton>
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
              <ContentPost content={card} key={i} />
            ))}
        </Carousel>
        <div className="block md:hidden mt-6 flex justify-center w-full">
          <LinkButton href="/posts" variant="secondary">
            Ver Todos
            <Icon
              id="expand"
              className="transform -rotate-90 !w-[8px] !h-[8px]"
            />
          </LinkButton>
        </div>
      </ContentWrapper>
    </Wrapper>
  );
};
