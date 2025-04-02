import { ProjectSection } from "@/components/ProjectCard/Section/ProjectSection";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { SectionHeader } from "@/utils/interfaces";
import { AboutSection } from "@/components/About/About";
import { RecentSection } from "@/components/RecentSection/RecentSection";
import PreviewSection from "@/components/PreviewSection/PreviewSection";
import PanelSection from "@/components/PanelCard/Section/PanelSection";

export const revalidate = 60;

export default async function Home() {
  const MAX_SiZE = 8;
  const {
    partners,
    sectionHead,
    post: posts,
    previewCard,
    panels,
  } = await getContent([
    "partners",
    "sectionHead",
    "post",
    "previewCard",
    "panels",
  ]);

  return (
    <HubTemplate>
      <PreviewSection cards={previewCard} />

      <RecentSection
        content={posts.slice(0, MAX_SiZE)}
        header={sectionHead.find(
          (section: { fields: { id: string } }) => section.fields.id === "new",
        )}
      />
      <AboutSection
        header={sectionHead.find(
          (section: { fields: { id: string } }) =>
            section.fields.id === "about",
        )}
      />
      <PanelSection
        header={sectionHead.find(
          (sec: { fields: SectionHeader }) => sec.fields.id == "panels",
        )}
        panels={panels}
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
