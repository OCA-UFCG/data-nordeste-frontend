"use client";

import type { ReactElement } from "react";
import ContentPost from "@/components/ContentPost/ContentPost";
import PreviewCard from "@/components/PreviewCard/PreviewCard";
import { IPublication, IPreviewCard } from "@/utils/interfaces";

type PostCarouselProps = {
  variant: "post";
  items: IPublication[];
};

type PreviewCarouselProps = {
  variant: "preview";
  items: IPreviewCard[];
};

type Props = PostCarouselProps | PreviewCarouselProps;

const cardGridClassName =
  "grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4";

function getSortedPosts(items: IPublication[]): IPublication[] {
  return [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function CardCarousel({ variant, items }: Props): ReactElement {
  const visibleItems =
    variant === "post" ? getSortedPosts(items).slice(0, 4) : items.slice(0, 4);

  return (
    <div className="flex justify-center w-full">
      <div className={cardGridClassName}>
        {visibleItems.map((item, i) => (
          <div key={i} className="h-full">
            {variant === "post" ? (
              <ContentPost content={item as IPublication} />
            ) : (
              <PreviewCard content={item as IPreviewCard} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
