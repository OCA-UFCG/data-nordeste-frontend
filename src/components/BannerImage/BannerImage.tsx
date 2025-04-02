import { BannerContainer, Banner } from "./BannerImage.styles";

const BannerImage = () => {
  return (
    <BannerContainer>
      <Banner src={"/banner.png"} />
    </BannerContainer>
  );
};

export default BannerImage;
