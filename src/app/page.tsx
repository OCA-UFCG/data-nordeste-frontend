import { ProjectSection } from "@/components/ProjectSection/ProjectSection";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { SectionHeader } from "@/utils/interfaces";
import { AboutSection } from "@/components/AboutSection/AboutSection";
import { RecentSection } from "@/components/RecentSection/RecentSection";
import PreviewSection from "@/components/PreviewSection/PreviewSection";
import MainBanner from "@/components/BannerImage/BannerImage";
import DataSection from "@/components/DataSection/DataSection";

export const revalidate = 60;

export default async function Home() {
  const MAX_SiZE = 8;
  const {
    partners,
    sectionHead,
    post: posts,
    previewCards,
    theme,
    mainBanner,
  } = await getContent([
    "partners",
    "sectionHead",
    "post",
    "previewCards",
    "panels",
    "theme",
    "mainBanner",
  ]);

  return (
    <HubTemplate>
      <MainBanner content={mainBanner[0]} />
      <PreviewSection
        header={sectionHead.find(
          (sec: { fields: SectionHeader }) => sec.fields.id == "preview",
        )}
        cards={previewCards}
      />
      <RecentSection
        content={posts.slice(0, MAX_SiZE)}
        header={sectionHead.find(
          (section: { fields: { id: string } }) => section.fields.id === "new",
        )}
      />
      <DataSection
        header={sectionHead.find(
          (sec: { fields: SectionHeader }) => sec.fields.id == "panels",
        )}
        categories={theme}
      />
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
