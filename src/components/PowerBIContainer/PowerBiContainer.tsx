"use client";
import { ReportData } from "@/utils/interfaces";
import { Wrapper, Title } from "./PowerBiContainer.styles";

const PowerBIContainer = ({ panel }: { panel: { fields: ReportData } }) => {
  const { macroTheme, title, source } = panel.fields;

  return (
    <Wrapper>
      <Title>{macroTheme}</Title>
      <iframe
        src={source}
        title={title}
        width="100%"
        height="100%"
        allowFullScreen={true}
        style={{ border: "none" }}
      />
    </Wrapper>
  );
};

export default PowerBIContainer;
