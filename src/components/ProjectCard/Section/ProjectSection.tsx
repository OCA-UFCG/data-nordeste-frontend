import { Project, SectionHeader } from "@/utils/interfaces";
import ProjectCard from "../ProjectCard";
import {
  Wrapper,
  Projects,
  Header,
  Title,
  Subtitle,
} from "./ProjectSection.styles";

export const ProjectSection = ({
  header,
  projects,
}: {
  header?: { fields: SectionHeader };
  projects?: { fields: Project }[];
}) => {
  const { title, id, subtitle } = header?.fields || {
    title: "",
    id: "",
    subtitle: "",
  };

  return (
    <Wrapper id={id}>
      <Header>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
      </Header>
      <Projects>
        {projects?.map((partner: { fields: Project }) => (
          <ProjectCard key={partner.fields.name} project={partner} />
        ))}
      </Projects>
    </Wrapper>
  );
};
