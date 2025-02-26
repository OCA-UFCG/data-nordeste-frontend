import { ProjectSection } from "@/components/ProjectCard/Section/ProjectSection";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { SectionHeader } from "@/utils/interfaces";

export default async function Home() {
  const { partners, sectionHead } = await getContent([
    "partners",
    "sectionHead",
  ]);

  return (
    <HubTemplate>
      <ProjectSection
        header={sectionHead.find(
          (sec: { fields: SectionHeader }) => sec.fields.id == "projects",
        )}
        projects={partners}
      />
    </HubTemplate>
  );
}
