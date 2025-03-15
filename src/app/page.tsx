import { ProjectSection } from "@/components/ProjectCard/Section/ProjectSection";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { SectionHeader } from "@/utils/interfaces";
import { AboutSection } from "@/components/About/About";
import InitialBannerSection from "@/components/InitialBannerSection/InitialBannerSection";
import { RecentSection } from "@/components/RecentSection/RecentSection";

export const revalidate = 60;
export const MAX_SiZE = 8;

export default async function Home() {
  const {
    partners,
    sectionHead,
    post: posts,
  } = await getContent(["partners", "sectionHead", "post"]);

  return (
    <HubTemplate>
      <InitialBannerSection sectionHead={sectionHead} />
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
