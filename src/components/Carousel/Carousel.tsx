"use client";

import { useEffect, useRef } from "react";
import "@glidejs/glide/dist/css/glide.core.min.css";
import "@glidejs/glide/dist/css/glide.theme.min.css";

import Glide from "@glidejs/glide";

import {
  Button,
  Card,
  Card2,
  LeftIcon,
  RightIcon,
  Slides,
  Wrapper,
} from "./Carousel.styles";

export const Carousel = () => {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    new Glide(sliderRef.current, {
      perView: 4,
      gap: 16,
      autoplay: 5000,
      bound: true,
      breakpoints: {
        1200: {
          perView: 4,
        },
        1000: {
          perView: 3,
        },
        800: {
          perView: 2,
        },
        600: {
          perView: 1,
        },
      },
    }).mount();
  }, []);

  return (
    <Wrapper className="glide" ref={sliderRef}>
      <div className="glide__track" data-glide-el="track">
        <Slides className="glide__slides">
          {[...Array(10)].map((_, i) =>
            i % 2 == 0 ? (
              <Card className="glide__slide" key={i}>
                Card {i}
              </Card>
            ) : (
              <Card2 className="glide__slide" key={i}>
                Card {i}
              </Card2>
            ),
          )}
        </Slides>
      </div>

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
