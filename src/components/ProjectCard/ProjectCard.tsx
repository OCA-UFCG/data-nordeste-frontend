import { Project } from "@/utils/interfaces";
import {
  Thumb,
  Wrapper,
  InfoWrapper,
  TextWrapper,
  Title,
  Description,
  Button,
  ArrowIcon,
} from "./ProjectCard.styles";

const ProjectCard = ({ project }: { project: { fields: Project } }) => {
  const { name, description, link, thumb } = project.fields;

  return (
    <Wrapper>
      <Thumb
        src={`https:${thumb.fields.file.url}`}
        alt=""
        width={300}
        height={200}
      />
      <InfoWrapper>
        <TextWrapper>
          <Title>{name}</Title>
          <Description>{description}</Description>
        </TextWrapper>
        <Button as="a" href={link} target="_blank">
          <ArrowIcon id={"link-arrow"} size={12} />
          Acessar
        </Button>
      </InfoWrapper>
    </Wrapper>
  );
};

export default ProjectCard;
