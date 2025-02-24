import { getContent } from "@/utils/functions";
import InitialBannerSection from "@/components/InitialBannerSection/InitialBannerSection";

export default async function Home() {
  const { sectionHead } = await getContent(["sectionHead"]);

  return <InitialBannerSection sectionHead={sectionHead} />;
}
