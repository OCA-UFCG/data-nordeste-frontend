import Image from "next/image";
import { Icon } from "@/components/Icon/Icon";
import { MacroTheme } from "@/utils/interfaces";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { cn } from "@/lib/utils";

type Props = {
  content: MacroTheme;
  className?: string;
  priorityImage?: boolean;
  tags?: string[];
  logoIconId: string;
  logoBackgroundColor: string;
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

  const derivedTags = tags?.length
    ? tags
    : content.tags?.length
      ? content.tags
      : [];
  const backgroundUrl = content.banner?.url ?? "";

  return (
    <section className={cn(`relative w-full`, className)}>
      <div className="relative w-full overflow-hidden z-0">
        {backgroundUrl ? (
          <Image
            className="absolute inset-0 w-full h-full object-cover object-[center_43%]"
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
        <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-black via-transparent to-transparent"></div>

        <div className="relative z-10 w-full">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20">
            <div className="min-h-[500px] py-12 flex items-end">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-[36px] w-full">
                <div
                  className="flex items-center justify-center p-8 rounded-[8px] shrink-0"
                  style={{ backgroundColor: logoBackgroundColor }}
                >
                  <Icon
                    id={logoIconId}
                    width={168}
                    height={117}
                    className="h-40 lg:h-32 w-40 lg:w-32 filter brightness-0 invert opacity-100"
                  />
                </div>

                <div className="flex flex-col gap-4 sm:gap-5 lg:gap-[24px] w-full max-w-[1044px]">
                  <div className="flex flex-col gap-2 md:text-left text-center">
                    <h1 className="text-white font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-[48px] leading-tight lg:leading-[48px] tracking-tight lg:tracking-[-0.012em]">
                      {title}
                    </h1>

                    {!!derivedTags?.length && (
                      <div className="flex flex-row flex-wrap gap-2 justify-center md:justify-start">
                        {derivedTags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center justify-center px-[10px] py-[2px] h-[20px] rounded-full bg-[#D65384] text-white text-[12px] leading-[16px] font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!!content.description?.json && (
                    <div className="text-white text-sm sm:text-base lg:text-[16px] leading-relaxed lg:leading-[150%] font-medium max-w-[1044px] md:text-left text-center">
                      {" "}
                      {documentToReactComponents(content.description.json)}
                    </div>
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
