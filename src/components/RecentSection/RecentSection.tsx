"use client";

import { IPublication, SectionHeader } from "@/utils/interfaces";
import { LinkButton } from "../LinkButton/LinkButton";
import { Icon } from "../Icon/Icon";
import { FILTERS, RecentFilterKey, TypeFilter } from "./TypeFilter";
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
  const [posts, setPosts] = useState(content);
  const [selectedType, setSelectedType] = useState<RecentFilterKey>(
    FILTERS.all.key,
  );

  const fetchPosts = useCallback(async (types: RecentFilterKey) => {
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
    <RecentSectionView
      header={header}
      posts={posts}
      selectedType={selectedType}
      onTypeChange={fetchPosts}
    />
  );
};

export const RecentSectionView = ({
  header,
  posts,
  selectedType,
  onTypeChange,
}: {
  header?: SectionHeader;
  posts: IPublication[];
  selectedType: RecentFilterKey;
  onTypeChange: (value: RecentFilterKey) => void;
}) => {
  const { id, title, subtitle } = header || {
    title: "",
    id: "",
    subtitle: "",
  };

  return (
    <section
      className="w-full max-w-[1440px] px-6 lg:px-20 pt-12 lg:pt-[48px] pb-12 lg:pb-[48px] content-center flex flex-col gap-6 box-border"
      id={id}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-6 justify-between w-full items-center">
          <h2 className="text-[30px] font-semibold leading-[36px] text-[#292829]">
            {title}
          </h2>

          <div className="flex gap-6 items-center">
            <TypeFilter onChange={onTypeChange} />
            <LinkButton
              href={FILTERS[selectedType].href}
              variant="secondary"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-[#EFEFEF] rounded-md text-[#077432] hover:bg-grey-100"
              disabled={selectedType === FILTERS.all.key}
            >
              <span className="text-sm font-medium">Ver Todos</span>
              <Icon className="rotate-270" id="expand" size={16} />
            </LinkButton>
          </div>
        </div>
        <p className="hidden md:block text-sm text-grey-600">{subtitle}</p>
        <p className="flex md:hidden text-sm text-grey-600">{subtitle}</p>
      </div>

      <CardCarousel items={posts} variant="post" />

      <LinkButton
        href={FILTERS[selectedType].href}
        variant="secondary"
        className="md:hidden items-center gap-2 px-4 py-2 bg-white border border-[#EFEFEF] rounded-md text-[#077432]"
        disabled={selectedType === FILTERS.all.key}
      >
        <span className="text-sm font-medium">Ver Todos</span>
        <Icon className="rotate-270" id="expand" size={16} />
      </LinkButton>
    </section>
  );
};
