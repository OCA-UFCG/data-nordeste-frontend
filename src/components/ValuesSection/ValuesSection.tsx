import { IValues } from "@/utils/interfaces";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import Image from "next/image";

const ValuesSection = ({ content }: { content: { fields: IValues }[] }) => {
  const { title, thumb, details } = content[0].fields;

  return (
    <section className="flex items-center flex-col w-full px-6 py-9 lg:px-[80px] lg:py-[32px]">
      <div className="flex flex-col w-full lg:max-w-[1440px] h-fit gap-[24px]">
        <h1 className="text-[24px] lg:text-[30px] font-bold">{title}</h1>
        <div className="">
          <Image
            className="w-full float-none md:float-left h-full md:max-w-[300px] object-cover rounded-md aspect-[16/9] order-1 mb-4 mr-4"
            src={`https:${thumb.fields.file.url}`}
            alt={"Sobre nós"}
            width={1200}
            height={800}
          />
          <div className="h-full text-gray-800 order-2 text-justify">
            {documentToReactComponents(details)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;
