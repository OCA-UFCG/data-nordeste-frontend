import { Project, SectionHeader } from "@/utils/interfaces";
import ProjectCard from "@/components/ProjectCard/ProjectCard";

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
    <section id={id} className="w-full py-10 bg-grey-100">
      <div className="w-full max-w-[1440px] mx-auto px-4 flex flex-col gap-6 box-border">
        <h2 className="text-3xl font-semibold">{title}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 justify-center gap-10 w-full max-w-full">
          {projects?.map((partner: { fields: Project }) => (
            <ProjectCard key={partner.fields.name} project={partner} />
          ))}
        </div>
      </div>
    </section>
  );
};
