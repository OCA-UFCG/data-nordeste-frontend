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
        <div
          className="flex flex-col w-full bg-white gap-3 box-border py-5 px-3 lg:px-6 py-10 
                     justify-center items-center shadow-md rounded-lg 
                     -translate-y-4 lg:-translate-y-12"
        >
          <PreviewContent header={header} cards={cards} />
        </div>
      </div>
    </section>
  );
};

export default PreviewSection;