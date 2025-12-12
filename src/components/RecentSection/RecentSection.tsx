"use client";

import { IPublication, SectionHeader } from "@/utils/interfaces";
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
import { FILTERS, TypeFilter } from "./TypeFilter";
import { useCallback, useState } from "react";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import { POSTS_QUERY } from "@/utils/queries";

export const RecentSection = ({
  header,
  content,
}: {
  header?: SectionHeader;
  content: IPublication[];
}) => {
  const { id, title, subtitle } = header || {
    title: "",
    id: "",
    subtitle: "",
  };
  const [posts, setPosts] = useState(content);
  const [selectedType, setSelectedType] = useState<"all" | "panels" | "posts">(
    FILTERS.all.key,
  );

  const fetchPosts = useCallback(async (types: "all" | "panels" | "posts") => {
    setSelectedType(types);

    const { postCollection: filteredPosts } = await getContent<{
      postCollection: { items: IPublication[] };
    }>(POSTS_QUERY, {
      limit: POSTS_PER_PAGE,
      filter: {
        type_in: FILTERS[types].filter,
      },
    });

    setPosts(filteredPosts.items);
  }, []);

  return (
    <section
      className="w-full max-w-[1440px] px-4 lg:px-20 pt-8 lg:pt-0 pb-8 ontent-center flex flex-col gap-6 box-border"
      id={id}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-4 justify-between w-full">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold">{title}</h2>
            <p className="flex md:hidden text-sm">{subtitle}</p>
          </div>

          <div className="flex gap-6">
            <TypeFilter onChange={fetchPosts} />
            <LinkButton
              href={FILTERS[selectedType].href}
              variant="secondary"
              className="w-fit hidden md:flex"
              disabled={selectedType === FILTERS.all.key}
            >
              <p>Ver Todos</p>
              <Icon className="rotate-270 size-2" id="expand" />
            </LinkButton>
          </div>
        </div>
        <p className="hidden md:block text-sm">{subtitle}</p>
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
            {posts
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
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
      <LinkButton
        href={FILTERS[selectedType].href}
        variant="secondary"
        className="lg:hidden"
        disabled={selectedType === FILTERS.all.key}
      >
        <p>Ver Todos</p>
        <Icon className="rotate-270 size-2" id="expand" />
      </LinkButton>
    </section>
  );
};
