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

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

const GalleryCarousel = ({
  album,
  length,
}: {
  album: any[];
  length: string;
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const slides = album.map((photo: any) => ({
    src: `https:${photo?.fields?.file?.url || ""}`,
    alt: photo?.fields?.description || "",
  }));

  return (
    <section className="flex items-center justify-center w-full">
      <div className="flex justify-center w-full max-w-[1440px]">
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 5000 })]}
          className="flex flex-col gap-4 content-carousel py-4"
        >
          <CarouselContent className="-ml-0">
            {album.map((photo: any, index: number) => {
              const imageUrl = `https:${photo?.fields?.file?.url || ""}`;
              const height =
                (600 * photo?.fields?.file?.details?.image?.height) /
                photo?.fields?.file?.details?.image?.width;

              return (
                <CarouselItem
                  key={index}
                  className={`flex justify-center items-center ${length}`}
                >
                  <div
                    className="cursor-zoom-in"
                    onClick={() => {
                      setPhotoIndex(index);
                      setLightboxOpen(true);
                    }}
                  >
                    <Image
                      alt={photo?.fields?.description || ""}
                      width={600}
                      height={height}
                      src={imageUrl}
                      className="w-fit rounded-lg"
                    />
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={photoIndex}
        plugins={[Zoom, Thumbnails]}
      />
    </section>
  );
};

export default GalleryCarousel;
