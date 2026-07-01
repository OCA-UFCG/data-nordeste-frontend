import { IValues } from "@/utils/interfaces";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import Image from "next/image";

const ValuesSection = ({ content }: { content: IValues[] }) => {
  const { title, thumb, details } = content[0];

  return (
    <section className="flex items-center flex-col w-full px-6 lg:px-20 py-6">
      <div className="flex flex-col w-full max-w-[1280px] gap-6">
        <h1 className="text-[30px] font-semibold leading-[36px] tracking-[-0.0075em] text-[#292829] pb-2">
          {title}
        </h1>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {thumb?.url && (
            <Image
              className="w-full lg:w-[274px] h-[248px] object-cover rounded-lg shrink-0"
              src={thumb.url}
              alt={"Sobre nós"}
              width={274}
              height={248}
            />
          )}
          <div className="prose max-w-none lg:flex-1 [&>p]:text-[16px] [&>p]:font-normal [&>p]:leading-[24px] [&>p]:text-[#292829] [&_*]:text-[#292829]">
            {documentToReactComponents(details.json)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;
