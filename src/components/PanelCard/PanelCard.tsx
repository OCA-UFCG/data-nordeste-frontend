import { ReportData } from "@/utils/interfaces";
import {
  Thumb,
  Wrapper,
  Title,
  Description,
  InfoWrapper,
  ArrowIcon,
  TitleWrapper,
  Link,
  ThumbContainer,
  DescriptionContainer,
} from "./PanelCard.styles";

const PanelCard = ({ data }: { data: { fields: ReportData } }) => {
  const { macroTheme, id, description, thumb } = data.fields;

  return (
    <Wrapper>
      <Link target="_blank" href={`/data-panel/${id}`}>
        <ThumbContainer>
          <Thumb
            src={`https:${thumb.fields.file.url}`}
            alt=""
            width={300}
            height={400}
          />
          <DescriptionContainer>
            <Description>{description}</Description>
          </DescriptionContainer>
        </ThumbContainer>

        <InfoWrapper>
          <TitleWrapper>
            <Title>{macroTheme}</Title>
            <ArrowIcon id={"link-arrow"} size={16} />
          </TitleWrapper>
        </InfoWrapper>
      </Link>
    </Wrapper>
  );
};

export default PanelCard;
