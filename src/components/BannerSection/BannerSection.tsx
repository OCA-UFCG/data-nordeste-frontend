import Banner from "./Banner/Banner";
import { Wrapper, MainWrapper } from "./BannerSection.styles";
import { ISectionHeader } from "@/utils/interfaces";

const BannerSection = ({
  sectionHead,
}: {
  sectionHead: ISectionHeader[];
}) => {
  return (
    <Wrapper full={"true"} id="initialBanner">
      <MainWrapper >
        <Banner sectionHead={sectionHead} />
      </MainWrapper>
    </Wrapper>
  );
};

export default BannerSection;
