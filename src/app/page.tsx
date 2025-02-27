import { ProjectSection } from "@/components/ProjectCard/Section/ProjectSection";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { SectionHeader } from "@/utils/interfaces";
import { AboutSection } from "@/components/About/About";
import InitialBannerSection from "@/components/InitialBannerSection/InitialBannerSection";

export const revalidate = 60;

export default async function Home() {
  const { partners, sectionHead } = await getContent([
    "partners",
    "sectionHead",
  ]);

  return (
    <HubTemplate>
      <InitialBannerSection sectionHead={sectionHead} />
      <AboutSection
        header={sectionHead.find(
          (section: { fields: { id: string } }) =>
            section.fields.id === "about",
        )}
      />
      <ProjectSection
        header={sectionHead.find(
          (sec: { fields: SectionHeader }) => sec.fields.id == "projects",
        )}
        projects={partners}
      />
    </HubTemplate>
  );
}
