import "@glidejs/glide/dist/css/glide.core.min.css";
import "@glidejs/glide/dist/css/glide.theme.min.css";

import {
  Card,
  Header,
  Logo,
  LogoContainer,
  Name,
  Wrapper,
} from "./PreviewSection.styles";
import { IPreviewCard } from "@/utils/interfaces";
import PreviewCard from "@/components/PreviewCard/PreviewCard";
import Carousel from "../Carousel/Carousel";

const PreviewSection = ({ cards }: { cards: { fields: IPreviewCard }[] }) => {
  const carouselConfig = {
    perView: cards.length > 5 ? 5 : cards.length,
    type: "carousel",
    gap: 16,
    autoplay: 5000,
    bound: true,
    breakpoints: {
      1250: {
        perView: cards.length > 4 ? 4 : cards.length,
      },
      1000: {
        perView: cards.length > 3 ? 3 : cards.length,
      },
      860: {
        perView: cards.length > 2 ? 2 : cards.length,
      },
      650: {
        perView: 1,
      },
    },
  };

  return (
    <Wrapper>
      <Header>
        <LogoContainer>
          <Logo src="/logo.png" alt="datane logo" width={24} height={24} />
          <Name>Data Nordeste</Name>
        </LogoContainer>
      </Header>
      <Carousel classname="out-control" config={carouselConfig}>
        {cards.map((card, i) => (
          <Card className="glide__slide" key={i}>
            <PreviewCard content={card} />
          </Card>
        ))}
      </Carousel>
    </Wrapper>
  );
};

export default PreviewSection;
