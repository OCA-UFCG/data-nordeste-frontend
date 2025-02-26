import { getContent } from "@/utils/functions";
import HubTemplate from "@/templates/HubTemplate";
import InitialBannerSection from "@/components/InitialBannerSection/InitialBannerSection";
import { AboutSection } from "@/components/About/About";

export default async function Home() {
  const { sectionHead } = await getContent(["sectionHead"]);

  return (
    <HubTemplate>
      <InitialBannerSection sectionHead={sectionHead} />
      <AboutSection
        header={sectionHead.find(
          (section: { fields: { id: string } }) =>
            section.fields.id === "about",
        )}
      />
    </HubTemplate>
  );
}
