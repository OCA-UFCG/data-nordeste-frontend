import PanelCard from "../PanelCard";
import { ReportData, SectionHeader } from "@/utils/interfaces";
import {
  PanelsContainer,
  Wrapper,
  Header,
  Title,
  Subtitle,
  RightIcon,
} from "./PanelSection.styles";

const PanelSection = ({
  header,
  panels,
}: {
  header?: { fields: SectionHeader };
  panels?: { fields: ReportData }[];
}) => {
  const { title, id, subtitle } = header?.fields || {
    title: "",
    id: "",
    subtitle: "",
  };

  const filteredData = panels
    ?.sort((a, b) => {
      if (a.fields.title < b.fields.title) {
        return -1;
      }
      if (a.fields.title > b.fields.title) {
        return 1;
      }

      // names must be equal
      return 0;
    })
    .filter((item) => item.fields.macroPainel === true);

  return (
    <Wrapper full={"false"} id={id}>
      <Header>
        <Title>
          {title} <RightIcon id="expand" size={14} />{" "}
        </Title>
        <Subtitle>{subtitle}</Subtitle>
      </Header>
      <PanelsContainer>
        {filteredData?.map((panel: { fields: ReportData }) => (
          <PanelCard key={panel.fields.title} data={panel} />
        ))}
      </PanelsContainer>

      {/* <Button>Ver mais</Button> */}
    </Wrapper>
  );
};

export default PanelSection;
