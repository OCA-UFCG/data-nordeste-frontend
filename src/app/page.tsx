import { getContent } from "@/utils/functions";
import HubTemplate from "@/templates/HubTemplate";
import InitialBannerSection from "@/components/InitialBannerSection/InitialBannerSection";

export default async function Home() {
  const { sectionHead } = await getContent(["sectionHead"]);

  return (
    <HubTemplate>
      <InitialBannerSection sectionHead={sectionHead} />
    </HubTemplate>
  );
}
