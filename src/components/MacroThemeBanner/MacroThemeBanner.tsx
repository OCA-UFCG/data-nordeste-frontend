import Image from "next/image";
import { Icon } from "@/components/Icon/Icon";
import { MacroTheme } from "@/utils/interfaces";
import { macroThemes } from "@/utils/constants";

type Props = {
  content: MacroTheme;
  className?: string;
  priorityImage?: boolean;
  tags?: string[];
  logoIconId?: string;
  logoBackgroundColor?: string;
};

export function MacroThemeBanner({
  content,
  className = "",
  priorityImage = true,
  tags,
  logoIconId,
  logoBackgroundColor,
}: Props) {
  const title = content.name;
  const textBanner = content.textBanner ?? "";
  const derivedTags = tags?.length
    ? tags
    : content.tags?.length
      ? content.tags
      : [];
  const backgroundUrl = content.imageBanner?.url ?? "";

  const derivedLogoIconId = logoIconId ?? macroThemes[content.id];
  const derivedLogoBackgroundColor = logoBackgroundColor ?? content.color;

  return (
    <section className={`relative w-full ${className}`}>
      <div className="relative w-full overflow-hidden z-0">
        {backgroundUrl ? (
          <Image
            className="absolute inset-0 w-full h-full object-cover object-[center_45%]"
            src={backgroundUrl}
            alt={title}
            width={1920}
            height={1080}
            priority={priorityImage}
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(90deg,_#000000_0%,_rgba(0,0,0,0)_100%)] opacity-100" />

        <div className="relative z-10 w-full">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20">
            <div className="min-h-[500px] py-12 flex items-center">
              <div className="w-full flex flex-col lg:flex-row items-center gap-6 lg:gap-9">
                <div
                  className="shrink-0 flex items-center justify-center rounded-sm w-[200px] h-[200px]"
                  style={{ backgroundColor: derivedLogoBackgroundColor }}
                >
                  <Icon
                    id={derivedLogoIconId}
                    width={225}
                    height={120}
                    className="filter brightness-0 invert opacity-95"
                  />
                </div>

                <div className="flex-1 w-full text-center lg:text-left">
                  <h1 className="text-white text-3xl sm:text-4xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
                    {title}
                  </h1>

                  {!!derivedTags?.length && (
                    <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-2">
                      {derivedTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-white/80 text-xs sm:text-sm font-medium px-3 py-1 rounded-full bg-white/8 border border-white/12 backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {!!textBanner && (
                    <p className="mt-5 text-white/90 text-base sm:text-lg leading-relaxed max-w-[72ch] mx-auto lg:mx-0">
                      {textBanner}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
