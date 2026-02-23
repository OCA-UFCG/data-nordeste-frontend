"use client";

import { IPublication, SectionHeader } from "@/utils/interfaces";
import { LinkButton } from "../LinkButton/LinkButton";
import { Icon } from "../Icon/Icon";
import { FILTERS, TypeFilter } from "./TypeFilter";
import { useCallback, useState } from "react";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import { POSTS_QUERY } from "@/utils/queries";
import { CardCarousel } from "../CardCarousel/CardCarousel";

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

      <CardCarousel items={posts} variant="post" />

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
