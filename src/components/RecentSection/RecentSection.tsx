"use client";

import { IPublication } from "@/utils/interfaces";
import ContentPost from "../ContentPost/ContentPost";
import { LinkButton } from "../LinkButton/LinkButton";
import { Icon } from "../Icon/Icon";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DotButton,
} from "../ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export const RecentSection = ({
  header,
  content,
}: {
  header: { fields: any };
  content: { fields: IPublication }[];
}) => {
  const { id, title, subtitle } = header.fields;

  return (
    <section
      className="w-full max-w-[1440px] px-4 pt-8 lg:pt-0 pb-8 ontent-center flex flex-col gap-6 box-border"
      id={id}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between w-full">
          <h2 className="text-3xl font-semibold">{title}</h2>
          <LinkButton
            href="/posts"
            variant="secondary"
            className="w-fit hidden md:flex"
          >
            <p>Ver Todos</p>
            <Icon className="rotate-270 size-2" id="expand" />
          </LinkButton>
        </div>
        <p className="text-sm">{subtitle}</p>
      </div>
      <div className="flex justify-center">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 10000,
            }),
          ]}
          className="flex flex-col gap-4 content-carousel"
        >
          <CarouselContent className="-ml-0">
            {content
              .sort(
                (a, b) =>
                  new Date(b.fields.date).getTime() -
                  new Date(a.fields.date).getTime(),
              )
              .map((card, i) => (
                <CarouselItem
                  key={i}
                  className="basis-1/1 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 p-0 md:p-2"
                >
                  <ContentPost content={card} key={i} />
                </CarouselItem>
              ))}
          </CarouselContent>
          <div className="flex md:hidden gap-2 w-full justify-center">
            {content.map((_, i) => (
              <DotButton tabIndex={i} key={i} />
            ))}
          </div>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
      <LinkButton href="/posts" variant="secondary" className="md:hidden">
        <p>Ver Todos</p>
        <Icon className="rotate-270 size-2" id="expand" />
      </LinkButton>
    </section>
  );
};
