import { Project } from "@/utils/interfaces";
import { LinkButton } from "../LinkButton/LinkButton";
import Image from "next/image";

const ProjectCard = ({ project }: { project: { fields: Project } }) => {
  const { name, description, link, thumb } = project.fields;

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full max-w-full md:max-w-[80%] lg:max-w-[48%] xl:max-w-[45%] mx-auto bg-white border border-grey-200 rounded-md hover:scale-[1.01] transition-transform duration-300">
      <a href={link} className="w-full h-full">
        <Image
          className="w-full h-full object-cover rounded-t-md md:rounded-l-md md:rounded-tr-none"
          src={`https:${thumb.fields.file.url}`}
          alt=""
          width={800}
          height={800}
        />
      </a>

      <div className="flex flex-col justify-between w-full h-full gap-2 items-center p-4 min-h-[200px] md:min-h-0">
        <div className="flex flex-col gap-2 w-full">
          <h3 className="text-xl font-semibold text-gray-800">{name}</h3>
          <p className="text-sm text-grey-600 leading-5">{description}</p>
        </div>
        <LinkButton href={link} className="md:w-full">
          Acessar
        </LinkButton>
      </div>
    </div>
  );
};

export default ProjectCard;
