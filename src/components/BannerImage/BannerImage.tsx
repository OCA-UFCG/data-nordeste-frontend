import {
  BannerContainer,
  Banner,
  BannerOverlay,
  TextButtonContainer,
  OverlayText,
  OverlayButton,
} from "./BannerImage.styles";

const BannerImage = () => {
  return (
    <BannerContainer>
      <BannerOverlay>
        <TextButtonContainer>
          <OverlayText>
            Interaja, pesquise e explore dados sobre o nordeste brasileiro
          </OverlayText>
          <OverlayButton>Saiba mais</OverlayButton>
        </TextButtonContainer>
      </BannerOverlay>
      <Banner src={"/banner.png"} />
    </BannerContainer>
  );
};

export default BannerImage;
