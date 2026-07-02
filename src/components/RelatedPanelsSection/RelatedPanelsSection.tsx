"use client";

import { SearchResultCard } from "@/components/SearchResultCard/SearchResultCard";
import type { SearchResult } from "@/features/search/types";

type RelatedPanelsSectionProps = {
  items: SearchResult[];
};

const relatedPanelsGridClassName =
  "grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4";

export const RelatedPanelsSection = ({ items }: RelatedPanelsSectionProps) => {
  if (!items.length) return null;

  return (
    <section className="w-full bg-white py-10">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-20">
        <h2 className="text-[30px] font-semibold leading-[36px] text-[#292829]">
          Conteúdo Relacionado
        </h2>
        <RelatedPanelsGrid items={items} />
      </div>
    </section>
  );
};

const RelatedPanelsGrid = ({ items }: RelatedPanelsSectionProps) => (
  <div className={relatedPanelsGridClassName}>
    {items.slice(0, 4).map((item) => (
      <div key={item.id} className="h-full">
        <SearchResultCard result={item} showAccessAction />
      </div>
    ))}
  </div>
);
