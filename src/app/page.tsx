import { ProjectSection } from "@/components/ProjectCard/Section/ProjectSection";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { SectionHeader } from "@/utils/interfaces";
import { AboutSection } from "@/components/About/About";
import InitialBannerSection from "@/components/InitialBannerSection/InitialBannerSection";
import { RecentSection } from "@/components/RecentSection/RecentSection";
import PreviewCarousel from "@/components/PreviewCarousel/PreviewCarousel";

export const revalidate = 60;

export default async function Home() {
  const MAX_SiZE = 8;
  const {
    partners,
    sectionHead,
    post: posts,
    previewCard,
  } = await getContent(["partners", "sectionHead", "post", "previewCard"]);

  return (
    <HubTemplate>
      <InitialBannerSection sectionHead={sectionHead} />
      <PreviewCarousel cards={previewCard} />

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
      <ProjectSection
        header={sectionHead.find(
          (sec: { fields: SectionHeader }) => sec.fields.id == "projects",
        )}
        projects={partners}
      />
    </HubTemplate>
  );
}
