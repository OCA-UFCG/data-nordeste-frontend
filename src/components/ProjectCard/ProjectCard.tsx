import { Project } from "@/utils/interfaces";
import {
  Thumb,
  Wrapper,
  InfoWrapper,
  TextWrapper,
  Title,
  Description,
  Link,
  ThumbContainer,
} from "./ProjectCard.styles";
import { LinkButton } from "../LinkButton/LinkButton";

const ProjectCard = ({ project }: { project: { fields: Project } }) => {
  const { name, description, link, thumb } = project.fields;

  return (
    <Wrapper>
      <Link href={link}>
        <ThumbContainer>
          <Thumb
            src={`https:${thumb.fields.file.url}`}
            alt=""
            width={600}
            height={300}
          />
        </ThumbContainer>
      </Link>
      <InfoWrapper>
        <TextWrapper>
          <Title>{name}</Title>
          <Description>{description}</Description>
        </TextWrapper>
        <LinkButton href={link} text="Acessar" className="md:w-full" />
      </InfoWrapper>
    </Wrapper>
  );
};

export default ProjectCard;
