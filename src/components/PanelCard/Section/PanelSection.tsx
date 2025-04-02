import PanelCard from "../PanelCard";
import { ReportData, SectionHeader } from "@/utils/interfaces";
import {
  PanelsContainer,
  Wrapper,
  Header,
  Title,
  Subtitle,
  Button,
  Input,
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

      return 0;
    })
    .filter((item) => item.fields.macroPainel === true);

  return (
    <Wrapper full={"false"} id={id}>
      <Header>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
      </Header>
      <Input id="see-all" type="checkbox" hidden />
      <PanelsContainer>
        {filteredData?.map((panel: { fields: ReportData }) => (
          <PanelCard key={panel.fields.title} data={panel} />
        ))}
      </PanelsContainer>
      <Button htmlFor="see-all" />
    </Wrapper>
  );
};

export default PanelSection;
