import { SectionHeader } from "@/utils/interfaces";
import { LinkButton } from "../LinkButton/LinkButton";
import Image from "next/image";

export const AboutSection = ({ header }: { header?: SectionHeader }) => {
  const { id, title, subtitle, thumb } = header || {
    id: "",
    title: "",
    subtitle: "",
  };

  return (
    <section id={id} className="w-full py-8 lg:py-12">
      <div className="w-full max-w-[1440px] mx-auto px-20 flex flex-col gap-6">
        <h2 className="text-[30px] leading-[36px] tracking-[-0.0075em] font-bold text-left">
          {title}
        </h2>
        <div className="flex flex-col lg:flex-row gap-6">
          <Image
            alt=""
            src={thumb?.url || ""}
            width={462}
            height={374}
            className="w-full lg:h-[374px] lg:w-[462px] rounded-lg"
          />
          <div className="flex flex-col items-start justify-between lg:max-h-[375px] lg:max-w-full gap-6">
            <p className="text-left whitespace-pre-line h-fit lg:overflow-auto">
              {subtitle}
            </p>
            <LinkButton
              href="/about?tab=nossa-historia"
              className="mt-auto w-full md:w-[300px]"
            >
              Saiba mais
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
};
