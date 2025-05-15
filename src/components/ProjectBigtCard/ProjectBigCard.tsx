import { Project } from "@/utils/interfaces";
import { LinkButton } from "../LinkButton/LinkButton";
import Image from "next/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

const ProjectBigCard = ({
  project,
  direction,
}: {
  project: { fields: Project };
  direction: string;
}) => {
  const { name, link, thumb, details } = project.fields;

  return (
    <section className="flex items-center justify-center w-full min-h-[200px] px-6 pt-3 pb-5 lg:px-20 lg:pt-10">
      <div className="flex flex-col items-left max-w-[1440px]">
        <h2 className="font-semibold text-3xl py-4">{name}</h2>
        <div className="flex flex-col lg:flex-row w-full overflow-hidden justify-between">
          <div
            className={`flex flex-col lg:w-[35%] order-1 mb-4 ${
              direction === "left" ? "lg:order-1" : "lg:order-2"
            }`}
          >
            <Image
              className="w-full h-full object-cover rounded-md aspect-[16/9] mb-4"
              src={`https:${thumb.fields.file.url}`}
              alt={name}
              width={800}
              height={800}
            />
            <LinkButton href={link} className="w-fit hidden md:flex">
              Acessar
            </LinkButton>
          </div>
          <div
            className={`text-base text-gray-800 h-full space-y-4 lg:w-[65%] order-2 ${
              direction === "left"
                ? "lg:order-2 lg:pl-12"
                : "lg:order-1 lg:pr-12"
            }`}
          >
            {documentToReactComponents(details)}
          </div>
        </div>
        <LinkButton href={link} className="md:hidden mt-5">
          Acessar
        </LinkButton>
      </div>
    </section>
  );
};

export default ProjectBigCard;
