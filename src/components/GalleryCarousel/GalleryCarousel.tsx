import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

const GalleryCarousel = ({
  album,
  length,
}: {
  album: any[];
  length: string;
}) => {
  return (
    <section className="flex items-center justify-center w-full">
      <div className="flex justify-center w-full max-w-[1440px]">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="flex flex-col gap-4 content-carousel py-4"
        >
          <CarouselContent className="-ml-0">
            {album.map((photo: any, index: number) => (
              <CarouselItem
                key={index}
                className={`flex justify-center items-center ${length}`}
              >
                <Image
                  alt=""
                  width={600}
                  height={
                    (600 * photo?.fields?.file?.details?.image?.height) /
                    photo?.fields?.file?.details?.image?.width
                  }
                  src={`https:${photo?.fields?.file.url || ""}`}
                  className="w-fit rounded-lg"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default GalleryCarousel;
