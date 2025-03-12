import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { Container } from "./styles";

export default async function DataPage() {
  const { panels } = await getContent(["panels"]);
  
  return (
    <HubTemplate>
      <Container>
        {/* Update this to switch the panel base on the user selection */}
        <PowerBIContainer panel={panels[0]} /> 
      </Container>
    </HubTemplate>
  );
};
