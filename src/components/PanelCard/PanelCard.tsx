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
  const { macroTheme, title, description, thumb } = data.fields;

  return (
    <Wrapper>
      <Link href={`/data-panel/${title}`}>
        <ThumbContainer>
          <Thumb
            src={`https:${thumb.fields.file.url}`}
            alt=""
            width={600}
            height={600}
          />
          <DescriptionContainer>
            <Description>{description || "Visualizar"}</Description>
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
