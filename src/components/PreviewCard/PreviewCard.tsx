import { IPreviewCard } from "@/utils/interfaces";
import {
  ContentWrapper,
  Title,
  TitleWrapper,
  ArrowIcon,
  Header,
  Data,
  Note,
  Wrapper,
  Subtitle,
} from "./PreviewCard.styles";

const PreviewCard = ({ content }: { content: { fields: IPreviewCard } }) => {
  const { title, subtitle, data, note, link } = content.fields;

  return (
    <Wrapper href={link || ""}>
      <Header>
        <TitleWrapper>
          <Title>{title}</Title>
          <ArrowIcon id="arrow" size={11} />
        </TitleWrapper>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </Header>
      <ContentWrapper>
        <Data>{data}</Data>
        <Note>{note}</Note>
      </ContentWrapper>
    </Wrapper>
  );
};

export default PreviewCard;
