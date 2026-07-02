import type { RelatedBoletim } from "@/features/boletim/types";
import { SearchResultCard } from "@/components/SearchResultCard/SearchResultCard";
import type { SearchResult, SearchItemType } from "@/features/search/types";

type RelatedBoletinsSectionProps = {
  items: RelatedBoletim[];
};

const toSearchResult = (item: RelatedBoletim): SearchResult => ({
  id: item.sys.id,
  source: "post",
  type: item.type as SearchItemType,
  title: item.title,
  description: item.description || "",
  href: `/boletim/${item.sys.id}`,
  date: item.date || null,
  thumb: item.thumb?.url || null,
  themes: [],
  tags: [],
  text: item.title,
  score: 0,
});

export const RelatedBoletinsSection = ({
  items,
}: RelatedBoletinsSectionProps) => {
  if (!items.length) return null;

  return (
    <section className="w-full bg-white py-10">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-20">
        <h2 className="text-[30px] font-semibold leading-[36px] text-[#292829]">
          Conteúdos relacionados
        </h2>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((item) => (
            <div key={item.sys.id} className="h-full">
              <SearchResultCard
                result={toSearchResult(item)}
                showAccessAction
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
