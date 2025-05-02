import { Project, SectionHeader } from "@/utils/interfaces";
import ProjectCard from "../ProjectCard";

export const ProjectSection = ({
  header,
  projects,
}: {
  header?: { fields: SectionHeader };
  projects?: { fields: Project }[];
}) => {
  const { title, id } = header?.fields || {
    title: "",
    id: "",
    subtitle: "",
  };

  return (
    <section
      id={id}
      className="w-full max-w-[1440px] px-4 py-6 content-center flex flex-col gap-6 box-border"
    >
      <h2 className="text-3xl font-semibold">{title}</h2>
      <div className="flex flex-wrap justify-center gap-10 w-full max-w-full">
        {projects?.map((partner: { fields: Project }) => (
          <ProjectCard key={partner.fields.name} project={partner} />
        ))}
      </div>
    </section>
  );
};
