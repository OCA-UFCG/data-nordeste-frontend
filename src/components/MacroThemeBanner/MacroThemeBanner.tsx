import Image from "next/image";
import { Icon } from "@/components/Icon/Icon";
import { MacroTheme } from "@/utils/interfaces";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { cn } from "@/lib/utils";
import { macroThemes } from "@/utils/constants";

type Props = {
  content: MacroTheme;
  className?: string;
  priorityImage?: boolean;
};

export function MacroThemeBanner({
  content,
  className = "",
  priorityImage = true,
}: Props) {
  const title = content.name;
  const iconId = macroThemes[content.id] || "list";

  const derivedTags = content.tags || [];
  const backgroundUrl = content.banner?.url ?? "";

  return (
    <section className={cn(`relative w-full`, className)}>
      <div className="relative z-0 w-full overflow-hidden">
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

        <div className="absolute inset-0 bg-[linear-gradient(90deg,_#000000_0%,_rgba(0,0,0,0)_100%)]" />

        <div className="relative z-10 w-full">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-0">
            <div className="flex min-h-[296px] items-end px-4 py-8 sm:px-6 lg:h-[296px] lg:min-h-[296px] lg:px-20 lg:py-12">
              <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start lg:gap-9">
                <div
                  className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[8px] p-2 sm:h-40 sm:w-40 lg:h-[200px] lg:w-[200px]"
                  style={{ backgroundColor: content.color }}
                >
                  <Icon
                    id={iconId}
                    width={184}
                    height={184}
                    className="h-24 w-24 text-white sm:h-32 sm:w-32 lg:h-[184px] lg:w-[184px]"
                  />
                </div>

                <div className="flex w-full max-w-[1044px] flex-col gap-4 sm:gap-5 lg:min-h-[200px] lg:justify-start">
                  <div className="flex flex-col gap-2 text-center md:text-left">
                    <h1 className="text-white text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-[48px] lg:leading-[48px] lg:tracking-[-0.012em]">
                      {title}
                    </h1>

                    {!!derivedTags?.length && (
                      <div className="flex flex-row flex-wrap justify-center gap-2 md:justify-start">
                        {derivedTags.map((tag) => (
                          <span
                            key={tag}
                            className="flex h-[29px] items-center justify-center rounded-full bg-[#D65384] px-[10px] py-[2px] text-[14px] leading-[16px] font-semibold text-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!!content.description?.json && (
                    <div
                      className="prose prose-invert max-w-[1044px] text-center md:text-left
                      prose-p:my-0 prose-p:text-sm prose-p:font-medium prose-p:leading-relaxed
                      prose-p:sm:text-base prose-p:lg:text-[16px] prose-p:lg:leading-[150%]"
                    >
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
