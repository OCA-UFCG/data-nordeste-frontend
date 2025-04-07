"use client";
import { ReportData } from "@/utils/interfaces";
import {
  Wrapper,
  Title,
  Header,
  Home,
  RightIcon,
  Text,
} from "./PowerBiContainer.styles";

const PowerBIContainer = ({
  panel,
  pageName,
}: {
  panel: { fields: ReportData };
  pageName?: string;
}) => {
  const { macroTheme, title, source } = panel.fields;

  return (
    <Wrapper>
      <Header>
        <Home href="/">
          <RightIcon id="expand" size={10} />
          <Text>Pagina inicial</Text>
        </Home>
        <Title>{macroTheme}</Title>
      </Header>
      <iframe
        src={source}
        title={pageName ? `${title}&pageName=${pageName}` : title}
        width="1220px"
        height="100%"
        allowFullScreen={true}
        style={{ border: "none" }}
      />
    </Wrapper>
  );
};

export default PowerBIContainer;
