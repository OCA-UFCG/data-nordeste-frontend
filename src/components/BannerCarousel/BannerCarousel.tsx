"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DotButton,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { IMainBanner } from "@/utils/interfaces";
import { Icon } from "../Icon/Icon";
import Image from "next/image";
import { LinkButton } from "../LinkButton/LinkButton";

const MainBanner = ({ content }: { content: IMainBanner[] }) => {
  return (
    <Carousel
      className="relative w-full"
      opts={{
        align: "center",
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 15000,
          stopOnInteraction: false,
        }),
      ]}
    >
      <CarouselContent>
        {content.map((item, index) => {
          const { title, subtitle, image, buttonUrl, buttonLabel } = item;

          return (
            <CarouselItem
              key={index}
              className="relative  w-full flex-shrink-0"
            >
              <div className="relative flex justify-center items-center px-4 w-full h-full min-h-[380px] lg:min-h-[510px]">
                <Image
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  src={image.url || ""}
                  alt=""
                  width={1920}
                  height={1080}
                  priority
                />
                <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-black via-transparent to-transparent"></div>
                <div className="absolute top-0 left-0 h-full w-[140%] bg-gradient-to-r from-black via-transparent to-transparent"></div>

                <div className="relative flex w-full max-w-[1440px] mx-auto py-20 px-2 md:px-20 h-full items-center justify-between z-30">
                  <div className="flex flex-col gap-4 lg:gap-8 w-full md:max-w-[70%]">
                    <h1 className="text-white text-3xl sm:text-4xl lg:text-6xl font-semibold leading-tight sm:leading-tight lg:leading-tight">
                      {title}
                    </h1>
                    <p className="text-white text-lg font-medium">{subtitle}</p>
                    <LinkButton
                      href={buttonUrl}
                      className="w-full md:max-w-fit"
                    >
                      {buttonLabel}
                    </LinkButton>
                  </div>
                  <Icon
                    id="logo-DNE"
                    width={200}
                    height={100}
                    className="hidden lg:block self-end filter brightness-0 invert z-30"
                  />
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>

      <div className="absolute bottom-0 left-0 right-0 w-full z-1 pb-12 lg:pb-[65px]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 md:px-4 md:py-2 flex gap-2">
            {content.map((_, indexDot) => (
              <DotButton key={indexDot} tabIndex={indexDot} />
            ))}
          </div>
        </div>
      </div>

      <CarouselPrevious className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-1 text-white bg-transparent hover:bg-white/50 hover:text-white transition-colors" />
      <CarouselNext className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-1 text-white bg-transparent hover:bg-white/50 hover:text-white transition-colors" />
    </Carousel>
  );
};

export default MainBanner;
