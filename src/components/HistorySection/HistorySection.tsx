import GalleryCarousel from "../GalleryCarousel/GalleryCarousel";
import AboutBigCard from "../AboutBigCard/AboutBigCard";
import { IAbout } from "@/utils/interfaces";

const HistorySection = ({ content }: { content: IAbout }) => {
  return (
    <section className="flex justify-center w-full px-6 lg:px-20 py-6">
      <div className="flex flex-col items-left w-full max-w-[1440px] gap-12">
        <AboutBigCard content={content} />
        <div className="flex flex-col gap-6">
          <h3 className="text-[24px] font-semibold leading-[32px] tracking-[-0.006em] text-[#085F2D]">
            Galeria
          </h3>
          <GalleryCarousel
            album={content.albumCollection.items}
            length={"basis-1/1 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"}
          />
        </div>
      </div>
    </section>
  );
};

export default HistorySection;
