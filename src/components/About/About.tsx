import { LinkButton } from "../LinkButton/LinkButton";
import { ContentWrapper, Subtitle, Title, Wrapper } from "./About.styles";

export const AboutSection = ({ header }: { header: { fields: any } }) => {
  const { id, title, subtitle } = header.fields;

  return (
    <Wrapper id={id}>
      <ContentWrapper>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        <LinkButton href="/" text="Saiba mais" />
      </ContentWrapper>
    </Wrapper>
  );
};
