import { About } from "@/utils/interfaces";
import Image from "next/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

const AboutBigCard = ({ content }: { content: { fields: About } }) => {
  const { details, thumb, id } = content.fields;

  return (
    <section className="flex items-center justify-center w-full">
      <div className="flex flex-col items-left">
        <h2 className="font-semibold text-3xl">{id}</h2>
        <div className="flex flex-col lg:flex-row w-full overflow-hidden justify-between items-top my-5">
          <Image
            className="w-full h-full max-h-[400px] object-cover rounded-md aspect-[4/3] order-1 mb-5"
            src={`https:${thumb.fields.file.url}`}
            alt={"Sobre nós"}
            width={600}
            height={600}
          />
          <div className="h-full max-h-[400px] overflow-y-auto text-base text-gray-800 order-2 lg:pl-6">
            {documentToReactComponents(details)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutBigCard;
