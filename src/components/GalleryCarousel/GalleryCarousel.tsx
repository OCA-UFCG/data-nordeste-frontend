import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

const GalleryCarousel = ({ album }: { album: any[] }) => {
  return (
    <section className="flex items-center justify-center w-full px-6 py-4 lg:px-20">
      <div className="flex flex-col items-left w-full max-w-[1440px]">
        <h2 className="text-green-900 text-2xl font-semibold">Galeria</h2>
        <div className="flex justify-center">
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
                  className="basis-1/1 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <Image
                    width={250}
                    height={250}
                    alt=""
                    src={`https:${photo?.fields?.file.url || ""}`}
                    className="w-full max-h-[250px] rounded-lg aspect-1/1 block object-cover object-top transition-transform group-hover:scale-102 duration-300"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default GalleryCarousel;
