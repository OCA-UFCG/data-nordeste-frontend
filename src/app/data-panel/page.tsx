import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { Container } from "./styles";

// Define the interface for the report data. Move to interfaces folder in the future
interface ReportData {
  title: string;
  reportId: string;
}

export default async function DataPage() {
  const { panels } = await getContent(["panels"]);

  return (
    <HubTemplate>
      <Container>
        {/* Update this to switch the panel base on the user selection */}
        <PowerBIContainer currentReportID={panels[0].fields.reportId} /> 
      </Container>
    </HubTemplate>
  );
};
