import { IAbout } from "@/utils/interfaces";
import Image from "next/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

const AboutBigCard = ({ content }: { content: IAbout }) => {
  const { details, thumb, id } = content;

  return (
    <div className="flex flex-col w-full gap-6">
      <h2 className="text-[30px] font-semibold leading-[36px] tracking-[-0.0075em] text-[#292829]">
        {id}
      </h2>
      <div className="flex flex-col lg:flex-row gap-6">
        {thumb && (
          <Image
            className="w-full lg:w-[450px] h-[337px] object-cover rounded-md shrink-0"
            src={thumb?.url || ""}
            alt={"Sobre nós"}
            width={450}
            height={337}
          />
        )}
        <div className="text-[16px] leading-[24px] text-[#292829] order-2 text-justify prose prose-lg max-w-none lg:flex-1">
          {documentToReactComponents(details.json)}
        </div>
      </div>
    </div>
  );
};

export default AboutBigCard;
