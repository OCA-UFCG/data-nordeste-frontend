"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Wrapper,
  TitleWrapper,
  Title,
  EmbedContainer,
} from "./PowerBIContainer.styles";

const PowerBIEmbed = dynamic(
  () => import("powerbi-client-react").then((mod) => mod.PowerBIEmbed),
  { ssr: false },
);

const PowerBIContainer = ({ currentReportID }: any) => {
  const [config, setConfig] = useState<any>(null);

  const initializePowerBI = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/powerbi/token?reportID=${currentReportID}`,
      );
      const { report_id, embed_url, embed_token } = await response.json();

      Promise.all([import("powerbi-client")]).then(([pbi]) => {
        setConfig({
          type: "report",
          id: report_id,
          embedUrl: embed_url,
          accessToken: embed_token,
          tokenType: pbi.models.TokenType.Embed,
          settings: {
            panes: {
              filters: {
                expanded: false,
                visible: false,
              },
            },
            permissions: {
              allowFullScreen: true,
              geolocation: true,
              loadingSpinner: true,
            },
            localeSettings: {
              language: "pt-BR",
              formatLocale: "pt-BR",
            },
          },
        });
      });
    } catch (error) {
      console.error("Error initializing report:", error);
    }
  }, [currentReportID]);

  useEffect(() => {
    initializePowerBI();
  }, [initializePowerBI]);

  const reportRef = useRef<any>(null);

  return (
    <Wrapper>
      <TitleWrapper>
        <Title>{"Painel de dados"}</Title>
        {/* <Button href="#new">Ver todos</Button> */}
      </TitleWrapper>
      <EmbedContainer>
        {config && (
          <PowerBIEmbed
            embedConfig={config}
            eventHandlers={
              new Map([
                ["loaded", () => console.log("Report loaded")],
                ["rendered", () => console.log("Report rendered")],
                ["error", (event: any) => console.log("Error:", event.detail)],
              ])
            }
            cssClassName="reportClass"
            getEmbeddedComponent={async (embeddedReport) => {
              reportRef.current = embeddedReport;
            }}
          />
        )}
      </EmbedContainer>
    </Wrapper>
  );
};

export default PowerBIContainer;
