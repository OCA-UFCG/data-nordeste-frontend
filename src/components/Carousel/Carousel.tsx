"use client";

import { ReactNode, useEffect, useRef } from "react";
import "@glidejs/glide/dist/css/glide.core.min.css";
import "@glidejs/glide/dist/css/glide.theme.min.css";

import Glide from "@glidejs/glide";

import {
  Button,
  LeftIcon,
  RightIcon,
  Slides,
  SlidesContainer,
  Wrapper,
} from "./Carousel.styles";

const Carousel = ({
  config,
  classname,
  children,
}: {
  classname?: string;
  config: any;
  children: ReactNode;
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    new Glide(sliderRef.current, config).mount();
  }, [config, sliderRef]);

  return (
    <Wrapper className={`glide ${classname}`} ref={sliderRef}>
      <SlidesContainer className="glide__track" data-glide-el="track">
        <Slides className="glide__slides">{children}</Slides>
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
