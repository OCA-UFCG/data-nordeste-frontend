import PanelCard from "../PanelCard";
import { IPublication, SectionHeader } from "@/utils/interfaces";
import {
  PanelsContainer,
  Wrapper,
  Header,
  Title,
  Subtitle,
  RightIcon,
  Button,
} from "./PanelSection.styles";

const PanelSection = ({
  header,
  panels,
}: {
  header?: { fields: SectionHeader };
  panels?: { fields: IPublication }[];
}) => {
  const { title, id, subtitle } = header?.fields || {
    title: "",
    id: "",
    subtitle: "",
  };

  const filteredData = panels?.filter(
    (item) => item.fields.type === "data-panel",
  );

  return (
    <Wrapper full={"false"} id={id}>
      <Header>
        <Title>
          {title} <RightIcon id="expand" size={14} />{" "}
        </Title>
        <Subtitle>{subtitle}</Subtitle>
      </Header>
      <PanelsContainer>
        {filteredData?.map((panel: { fields: IPublication }) => (
          <PanelCard key={panel.fields.title} data={panel} />
        ))}
      </PanelsContainer>

      {/* <Button>Ver mais</Button> */}
    </Wrapper>
  );
};

export default PanelSection;
