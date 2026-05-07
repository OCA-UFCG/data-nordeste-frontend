import { ProjectSection } from "@/components/ProjectSection/ProjectSection";
import HubTemplate from "@/templates/HubTemplate";
import {
  IFeedbackQuestion,
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
import { FeedbackSurvey } from "@/components/FeedbackSurvey/FeedbackSurvey";
import { findHomeSection } from "@/features/home/content";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";

export const metadata: Metadata = buildMetadata({
  description:
    "Consulte dados, indicadores, paineis interativos, datastories e publicacoes sobre desenvolvimento regional no Nordeste brasileiro.",
  path: "/",
});

interface IMainContent {
  partnersCollection: { items: Project[] };
  postCollection: { items: IPublication[] };
  themeCollection: { items: MacroTheme[] };
  mainBannerCollection: { items: IMainBanner[] };
  previewCardsCollection: { items: IPreviewCards[] };
  sectionHeadCollection: { items: SectionHeader[] };
  feedbackCollection: { items: IFeedbackQuestion[] };
}

export default async function Home() {
  const {
    partnersCollection: partners,
    postCollection: posts,
    themeCollection: theme,
    mainBannerCollection: mainBanner,
    previewCardsCollection: previewCards,
    sectionHeadCollection: sectionHead,
    feedbackCollection: { items: feedbackContent },
  }: IMainContent = await getContent(MAIN_PAGE_QUERY);

  return (
    <HubTemplate>
      <MainBanner content={mainBanner.items} />
      <PreviewSection
        header={findHomeSection(sectionHead.items, "preview")}
        cards={previewCards.items}
      />
      <RecentSection
        content={posts.items}
        header={findHomeSection(sectionHead.items, "new")}
      />
      <DataSection
        header={findHomeSection(sectionHead.items, "panels")}
        categories={theme.items}
      />
      <AboutSection header={findHomeSection(sectionHead.items, "about")} />
      {/* <CatalogSection
        header={sectionHead.items.find(
          (section: SectionHeader) => section.id === "catalog",
        )}
      /> */}

      <ProjectSection
        header={findHomeSection(sectionHead.items, "projects")}
        projects={partners.items}
      />
      <FeedbackSurvey
        header={findHomeSection(sectionHead.items, "survey")}
        submitHeader={findHomeSection(sectionHead.items, "survey-thank-u")}
        content={feedbackContent}
      />
    </HubTemplate>
  );
}
