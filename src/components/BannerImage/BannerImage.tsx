import { BannerContainer, Banner, GreenStrip } from "./BannerImage.styles";

const BannerImage = () => {
  return (
    <BannerContainer>
      <Banner src={"/banner.png"} />
      <GreenStrip />
    </BannerContainer>
  );
};

export default BannerImage;
