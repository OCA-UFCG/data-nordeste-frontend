import { Project } from "@/utils/interfaces";
import { LinkButton } from "../LinkButton/LinkButton";

const ProjectCard = ({ project }: { project: { fields: Project } }) => {
  const { name, description, link, thumb } = project.fields;

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between w-full max-w-[630px]">
      <a href={link} className="w-full">
        <div className="relative w-full overflow-hidden rounded">
          <img
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
            src={`https:${thumb.fields.file.url}`}
            alt=""
          />
        </div>
      </a>

      <div className="flex flex-col justify-around w-full gap-2 items-center px-4 min-h-[200px]">
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
