import { About } from "@/utils/interfaces";
import Image from "next/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

const AboutCard = ({ about }: { about: { fields: About } }) => {
  const { details, thumb } = about.fields;

  return (
    <section className="flex items-center justify-center w-full min-h-[200px] px-6 pt-9 lg:px-20 lg:pt-12">
      <div className="flex flex-col items-left max-w-[1440px]">
        <div className="flex flex-col lg:flex-row w-full overflow-hidden justify-between">
          <div className="flex flex-col lg:w-[35%] order-1 lg:order-1">
            <Image
              className="w-full h-full object-cover rounded-md aspect-[16/9] mb-4"
              src={`https:${thumb.fields.file.url}`}
              alt={"Sobre nós"}
              width={800}
              height={800}
            />
          </div>
          <div className="text-base text-gray-800 h-full max-h-[400px] overflow-y-auto space-y-4 lg:w-[65%] order-2 lg:order-2 lg:pl-12">
            {documentToReactComponents(details)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutCard;
