import InitialBanner from "./InitialBanner/InitialBanner";
import { Wrapper, MainWrapper } from "./InitialBannerSection.styles";
import { ISectionHeader } from "@/utils/interfaces";

const InitialBannerSection = ({
  sectionHead,
}: {
  sectionHead: ISectionHeader[];
}) => {
  return (
    <Wrapper full={"true"} id="initialBanner">
      <MainWrapper>
        <InitialBanner sectionHead={sectionHead} />
      </MainWrapper>
    </Wrapper>
  );
};

export default InitialBannerSection;
