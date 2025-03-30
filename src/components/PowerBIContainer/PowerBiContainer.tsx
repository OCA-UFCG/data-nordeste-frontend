"use client";
import {
  Wrapper,
  TitleWrapper,
  Title,
  EmbedContainer,
} from "./PowerBIContainer.styles";
import { ReportData } from "@/utils/interfaces";

const PowerBIContainer = ({ panel }: { panel: { fields: ReportData } }) => {
  const { title, reportId } = panel.fields;

  return (
    <Wrapper>
      <TitleWrapper>
        <Title>{title}</Title>
      </TitleWrapper>
      <EmbedContainer>
        <iframe
          title={title}
          width="1024"
          height="612"
          src={reportId}
          allowFullScreen={true}
        />
      </EmbedContainer>
    </Wrapper>
  );
};

export default PowerBIContainer;
