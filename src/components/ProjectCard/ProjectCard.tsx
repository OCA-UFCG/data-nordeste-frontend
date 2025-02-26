import { Project } from "@/utils/interfaces";
import {
  Thumb,
  Wrapper,
  TitleWrapper,
  Title,
  ExpandIcon,
  Description,
  InfoWrapper,
  Checkbox,
  Link,
} from "./ProjectCard.styles";

const ProjectCard = ({ project }: { project: { fields: Project } }) => {
  const { name, description, link, thumb } = project.fields;

  return (
    <Wrapper>
      <Link target="_blank" href={link}>
        <Thumb
          src={`https:${thumb.fields.file.url}`}
          alt=""
          width={300}
          height={200}
        />
      </Link>
      <InfoWrapper>
        <Checkbox
          id={name.replace(" ", "_").toLowerCase()}
          type="checkbox"
          defaultChecked={true}
          hidden
          readOnly
        />
        <TitleWrapper>
          <Title>{name}</Title>
          <ExpandIcon id="expand" size={12} />
        </TitleWrapper>
        <Description>{description}</Description>
      </InfoWrapper>
    </Wrapper>
  );
};

export default ProjectCard;
