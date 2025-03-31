import { IPublication } from "@/utils/interfaces";
import {
  Thumb,
  Wrapper,
  Title,
  Description,
  InfoWrapper,
  ArrowIcon,
  TitleWrapper,
  Link,
} from "./PanelCard.styles";

const PanelCard = ({ data }: { data: { fields: IPublication } }) => {
  const { title, description, link, thumb } = data.fields;

  return (
    <Wrapper>
      <Link target="_blank" href={link}>
        <Thumb
          src={`https:${thumb.fields.file.url}`}
          alt=""
          width={300}
          height={200}
        />
      </Link>
      <InfoWrapper>
        <TitleWrapper target="_blank" href={link}>
          <Title>{title}</Title>
          <ArrowIcon id={"link-arrow"} size={16} />
        </TitleWrapper>
        <Description>{description}</Description>
      </InfoWrapper>
    </Wrapper>
  );
};

export default PanelCard;
