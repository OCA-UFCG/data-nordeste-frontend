import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import GalleryCarousel from "../GalleryCarousel/GalleryCarousel";

const PartnersSection = ({ content }: { content: any }) => {
  return (
    <section className="w-full px-6 py-9 lg:px-20 lg:pt-12">
      <div className="flex flex-col items-left w-full max-w-[1440px]">
        <h2 className="font-semibold text-3xl pb-4">{content.fields.id}</h2>
        <div className="mb-9">
          {documentToReactComponents(content.fields.details)}
        </div>
        <GalleryCarousel
          album={content.fields.album}
          lenght={"basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"}
        />
      </div>
    </section>
  );
};

export default PartnersSection;
