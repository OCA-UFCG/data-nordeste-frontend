import { ProjectSection } from "@/components/ProjectSection/ProjectSection";
import HubTemplate from "@/templates/HubTemplate";
import {
  IMainBanner,
  IPreviewCards,
  IPublication,
  MacroTheme,
  Project,
  SectionHeader,
} from "@/utils/interfaces";
import { AboutSection } from "@/components/AboutSection/AboutSection";
import { RecentSection } from "@/components/RecentSection/RecentSection";
import PreviewSection from "@/components/PreviewSection/PreviewSection";
import MainBanner from "@/components/BannerCarousel/BannerCarousel";
import DataSection from "@/components/DataSection/DataSection";
import { getContent } from "@/utils/contentful";
import { MAIN_PAGE_QUERY } from "@/utils/queries";
import { REVALIDATE } from "@/utils/constants";

export const revalidate = REVALIDATE;

interface IMainContent {
  partnersCollection: { items: Project[] };
  postCollection: { items: IPublication[] };
  themeCollection: { items: MacroTheme[] };
  mainBannerCollection: { items: IMainBanner[] };
  previewCardsCollection: { items: IPreviewCards[] };
  sectionHeadCollection: { items: SectionHeader[] };
}

export default async function Home() {
  const {
    partnersCollection: partners,
    postCollection: posts,
    themeCollection: theme,
    mainBannerCollection: mainBanner,
    previewCardsCollection: previewCards,
    sectionHeadCollection: sectionHead,
  }: IMainContent = await getContent(MAIN_PAGE_QUERY);

  return (
    <HubTemplate>
      <MainBanner content={mainBanner.items} />
      <PreviewSection
        header={sectionHead.items.find(
          (sec: SectionHeader) => sec.id == "preview",
        )}
        cards={previewCards.items}
      />
      <RecentSection
        content={posts.items}
        header={sectionHead.items.find(
          (section: SectionHeader) => section.id === "new",
        )}
      />
      <DataSection
        header={sectionHead.items.find(
          (sec: SectionHeader) => sec.id == "panels",
        )}
        categories={theme.items}
      />
      <AboutSection
        header={sectionHead.items.find(
          (section: SectionHeader) => section.id === "about",
        )}
      />
      <ProjectSection
        header={sectionHead.items.find(
          (sec: SectionHeader) => sec.id == "projects",
        )}
        projects={partners.items}
      />
    </HubTemplate>
  );
}
