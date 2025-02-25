import { capitalize } from "@/utils/functions";
import {
  Wrapper,
  MainWrapper,
  ContentWrapper,
  LogoImage,
  SectionTitle,
  SubTitle,
} from "./InitialBannerSection.styles";
import { ISectionHeader } from "@/utils/interfaces";

const InitialBannerSection = ({
  sectionHead,
  reduced = false,
}: {
  sectionHead: ISectionHeader[];
  reduced?: boolean;
}) => {
  const header = sectionHead?.find(
    (head: ISectionHeader) => head.fields.id === "initialBanner",
  );

  const { title, subtitle } = header?.fields || {
    title: "",
    subtitle: undefined,
  };

  return (
    <Wrapper full={"true"} id="initialBanner">
      <MainWrapper>
        <ContentWrapper reduced={reduced}>
          <LogoImage
            id="logo-datane"
            width={reduced ? 62 : 350}
            height={reduced ? 62 : 350}
            reduced={true}
          />

          <SectionTitle reduced={reduced}>
            {reduced ? capitalize(title) : title.toUpperCase()}
          </SectionTitle>
          {!reduced && subtitle && <SubTitle>{subtitle}</SubTitle>}
        </ContentWrapper>
      </MainWrapper>
    </Wrapper>
  );
};

export default InitialBannerSection;
