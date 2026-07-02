import { ISection } from "@/utils/interfaces";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { ResponsiveHeader } from "../ResponsiveHeader";

const NAVIGATION_IDS = ["home", "explore", "catalog", "connections", "about"];
const NAVIGATION_ID_SET = new Set(NAVIGATION_IDS);

const HeaderSection = ({ content }: { content: ISection[] }) => {
  const orderedContent = sortContentByDesiredOrder<ISection>(
    content.filter((item) => NAVIGATION_ID_SET.has(item.id)),
    NAVIGATION_IDS,
  );

  return (
    <div className="sticky top-0 left-0 z-50 bg-white">
      <ResponsiveHeader content={orderedContent} />
    </div>
  );
};

export default HeaderSection;
