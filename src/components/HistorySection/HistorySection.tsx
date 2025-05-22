import GalleryCarousel from "../GalleryCarousel/GalleryCarousel";
import AboutBigCard from "../AboutBigCard/AboutBigCard";

const HistorySection = ({ content }: { content: any }) => {
  return (
    <section className="flex justify-center w-full px-6 py-9 lg:px-20">
      <div className="flex flex-col items-left w-full max-w-[1440px]">
        <AboutBigCard content={content} />
        <h2 className="text-green-900 text-2xl font-semibold">Galeria</h2>
        <GalleryCarousel
          album={content.fields.album}
          lenght={"basis-1/1 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"}
        />
      </div>
    </section>
  );
};

export default HistorySection;
