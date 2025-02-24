import { getContent } from "@/utils/functions";
import BannerSection from "@/components/BannerSection/BannerSection";

export default async function Home() {
  const { sectionHead } = await getContent(["sectionHead"]);

  return <BannerSection sectionHead={sectionHead} />;
}
