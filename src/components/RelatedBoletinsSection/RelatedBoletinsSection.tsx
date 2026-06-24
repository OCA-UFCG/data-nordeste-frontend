import type { RelatedBoletim } from "@/features/boletim/types";
import ContentPost from "@/components/ContentPost/ContentPost";

type RelatedBoletinsSectionProps = {
  items: RelatedBoletim[];
};

export const RelatedBoletinsSection = ({
  items,
}: RelatedBoletinsSectionProps) => {
  if (!items.length) return null;

  return (
    <section className="w-full bg-white py-10">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-20">
        <h2 className="text-[30px] font-semibold leading-[36px] text-[#292829]">
          Conteúdos Relacionados
        </h2>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((item) => (
            <div key={item.sys.id} className="h-full">
              <ContentPost content={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
