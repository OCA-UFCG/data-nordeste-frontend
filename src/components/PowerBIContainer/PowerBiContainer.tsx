"use client";
import {
  Wrapper,
  TitleWrapper,
  Title,
  EmbedContainer,
} from "./PowerBIContainer.styles";
import { ReportData } from "@/utils/interfaces";

const PowerBIContainer = ({ panel }: { panel: { fields: ReportData } }) => {
  const { title, source, width, height } = panel.fields;

  return (
    <Wrapper>
      <TitleWrapper>
        <Title>{title}</Title>
      </TitleWrapper>
      <EmbedContainer>
        <iframe
          title={title}
          width={width}
          height={height}
          src={source}
          allowFullScreen={true}
        />
      </EmbedContainer>
    </Wrapper>
  );
};

export default PowerBIContainer;
