import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import GalleryCarousel from "../GalleryCarousel/GalleryCarousel";
import { IPartners } from "@/utils/interfaces";

const PartnersSection = ({ content }: { content: IPartners }) => {
  return (
    <section className="flex justify-center w-full px-6 py-9 lg:px-20">
      <div className="flex flex-col items-left w-full max-w-[1440px] gap-6">
        <h2 className="font-semibold text-3xl">{content.id}</h2>
        <div className="prose max-w-none prose-p:text-base prose-p:font-medium prose-p:leading-6 prose-p:text-[#292829] prose-headings:text-[#292829] prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-xl prose-h3:font-semibold">
          {documentToReactComponents(content.details.json)}
        </div>
        <GalleryCarousel
          album={content.albumCollection.items}
          length={"basis-1/1 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"}
        />
      </div>
    </section>
  );
};

export default PartnersSection;
