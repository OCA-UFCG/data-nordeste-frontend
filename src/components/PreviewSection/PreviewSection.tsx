import { IPreviewCards, SectionHeader } from "@/utils/interfaces";
import SectionWrapper from "../SectionWrapper/SectionWrapper";
import PreviewContent from "./PreviewContent";

const PreviewSection = ({
  header,
  cards,
}: {
  cards: IPreviewCards[];
  header?: SectionHeader;
}) => {
  return (
    <section className="w-full bg-white">
      <div className="w-full max-w-[1440px] mx-auto px-3 lg:px-20">
        <SectionWrapper>
          <PreviewContent header={header} cards={cards} />
        </SectionWrapper>
      </div>
    </section>
  );
};

export default PreviewSection;