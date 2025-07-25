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
import Link from "next/link";

const GalleryCarousel = ({
  album,
  length,
}: {
  album: { url: string; width: string; height: string; description: string }[];
  length: string;
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const slides = album.map((photo: any) => ({
    src: `${photo?.url || ""}`,
    alt: photo?.description || "",
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
              const imageUrl = `${photo?.url || ""}`;
              const height = (600 * photo?.height) / photo?.width;

              const path = photo?.description;

              return (
                <CarouselItem
                  key={index}
                  className={`flex justify-center items-center ${length}`}
                >
                  {path ? (
                    <Link href={path}>
                      <Image
                        alt={photo.title || ""}
                        width={600}
                        height={height}
                        src={imageUrl}
                        className="w-fit rounded-lg cursor-pointer"
                      />
                    </Link>
                  ) : (
                    <div
                      className="cursor-zoom-in"
                      onClick={() => {
                        setPhotoIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <Image
                        alt={photo?.title || ""}
                        width={600}
                        height={height}
                        src={imageUrl}
                        className="w-fit rounded-lg"
                      />
                    </div>
                  )}
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
