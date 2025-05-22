"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

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
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          className="flex flex-col gap-4 content-carousel py-4"
        >
          <CarouselContent className="-ml-0">
            {album.map((photo: any, index: number) => (
              <CarouselItem
                key={index}
                className={`flex justify-center items-center pl-0 ${length}`}
              >
                {photo?.fields?.description ? (
                  <Link href={photo.fields.description} className="block">
                    <Image
                      alt={photo.fields.description}
                      width={150}
                      height={
                        (600 * photo?.fields?.file?.details?.image?.height) /
                        photo?.fields?.file?.details?.image?.width
                      }
                      src={`https:${photo?.fields?.file.url || ""}`}
                      className="w-fit rounded-lg"
                    />
                  </Link>
                ) : (
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
                )}
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
