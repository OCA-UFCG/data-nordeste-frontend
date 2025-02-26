import {
  Button,
  ContentWrapper,
  Subtitle,
  Title,
  Wrapper,
} from "./About.styles";

export const AboutSection = ({ header }: { header: { fields: any } }) => {
  const { id, title, subtitle } = header.fields;

  return (
    <Wrapper id={id}>
      <ContentWrapper>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        <Button href="#">Saiba mais</Button>
      </ContentWrapper>
    </Wrapper>
  );
};
