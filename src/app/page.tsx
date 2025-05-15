import { ProjectSection } from "@/components/ProjectSection/ProjectSection";
import HubTemplate from "@/templates/HubTemplate";
import { getContent, getPosts } from "@/utils/functions";
import { SectionHeader } from "@/utils/interfaces";
import { AboutSection } from "@/components/About/About";
import { RecentSection } from "@/components/RecentSection/RecentSection";
import PreviewSection from "@/components/PreviewSection/PreviewSection";
import MainBanner from "@/components/BannerImage/BannerImage";
import DataSection from "@/components/DataSection/DataSection";
import { POSTS_TYPES_RECENTS_FILTER } from "@/utils/constants";

export const revalidate = 60;

export default async function Home() {
  const { partners, sectionHead, previewCards, theme, mainBanner } =
    await getContent([
      "partners",
      "sectionHead",
      "previewCards",
      "theme",
      "mainBanner",
    ]);
  const posts = await getPosts("Data de publicação", 1, 8, {
    "fields.type[in]": POSTS_TYPES_RECENTS_FILTER.join(","),
  });

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
        content={posts}
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
      <DataSection
        header={sectionHead.find(
          (sec: { fields: SectionHeader }) => sec.fields.id == "panels",
        )}
        categories={theme}
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
