import { ContentWrapper, LogoImage } from "./InitialBanner.styles";
import { SectionHeader } from "@/components/SectionHeader/SectionHeader";
import { ISectionHeader } from "@/utils/interfaces";

const InitialBanner = ({
  sectionHead,
  reduced = false,
}: {
  sectionHead: ISectionHeader[];
  reduced?: boolean;
}) => {
  return (
    <ContentWrapper reduced={reduced}>
      <LogoImage
        id="logo-datane"
        width={reduced ? 62 : 350}
        height={reduced ? 62 : 350}
      />
      <SectionHeader
        alignment="center"
        id="initialBanner"
        sectionHead={sectionHead}
        titleFontWeight="900"
        titleFontSize={reduced ? "1.5rem" : "2.5rem"}
        subtitleFontStyle="italic"
        subtitleFontSize={reduced ? "1.5rem" : "2rem"}
        letterSpacingSub="0"
        reduced={reduced}
      />
    </ContentWrapper>
  );
};

export default InitialBanner;
