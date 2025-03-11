import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import { Container } from "./styles";
import HubTemplate from "@/templates/HubTemplate";

const DataPage = () => {
  const currentReportID: any = JSON.parse(
    process.env.NEXT_PUBLIC_POWERBI_REPORTS_ID || "[]",
  )[0];

  return (
    <HubTemplate>
      <Container>
        <PowerBIContainer currentReportID={currentReportID} />
      </Container>
    </HubTemplate>
  );
};

export default DataPage;
