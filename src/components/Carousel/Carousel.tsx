"use client";

import { useEffect, useRef } from "react";
import "@glidejs/glide/dist/css/glide.core.min.css";
import "@glidejs/glide/dist/css/glide.theme.min.css";

import Glide from "@glidejs/glide";

import {
  Button,
  Card,
  LeftIcon,
  RightIcon,
  Slides,
  SlidesContainer,
  Wrapper,
} from "./Carousel.styles";
import { IPublication } from "@/utils/interfaces";
import ContentPost from "../ContentPost/ContentPost";

const Carousel = ({ cards }: { cards: { fields: IPublication }[] }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    new Glide(sliderRef.current, {
      perView: cards.length > 3 ? 3 : cards.length,
      gap: 16,
      autoplay: 5000,
      bound: true,
      breakpoints: {
        1200: {
          perView: cards.length > 3 ? 3 : cards.length,
        },
        1000: {
          perView: cards.length > 2 ? 2 : cards.length,
        },
        800: {
          perView: cards.length > 2 ? 2 : cards.length,
        },
        600: {
          perView: 1,
        },
      },
    }).mount();
  }, [cards.length, sliderRef]);

  return (
    <Wrapper className="glide" ref={sliderRef}>
      <SlidesContainer className="glide__track" data-glide-el="track">
        <Slides className="glide__slides">
          {cards
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
        </Slides>
      </SlidesContainer>

      <div className="glide__arrows" data-glide-el="controls">
        <Button className="glide__arrow glide__arrow--left" data-glide-dir="<">
          <LeftIcon id="expand" size={10} />
        </Button>
        <Button className="glide__arrow glide__arrow--right" data-glide-dir=">">
          <RightIcon id="expand" size={10} />
        </Button>
      </div>
    </Wrapper>
  );
};

export default Carousel;
