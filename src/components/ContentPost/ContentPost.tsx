import { IPublication } from "@/utils/interfaces";
import {
  ContentWrapper,
  Link,
  Thumb,
  Title,
  TitleWrapper,
  ArrowIcon,
  DateWrapper,
  Header,
  Type,
  ThumbContainer,
  DescriptionContainer,
  Description,
} from "./ContentPost.styles";
import { POST_TYPES } from "@/utils/constants";

const ContentPost = ({ content }: { content: { fields: IPublication } }) => {
  const { title, thumb, link, date, type, description } = content.fields;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <ContentWrapper>
      <Header>
        <Type>
          {
            POST_TYPES[
              type as "additional-content" | "data-panel" | "newsletter"
            ]
          }
        </Type>
        <DateWrapper>{formattedDate}</DateWrapper>
      </Header>
      <Link href={link}>
        <div>
          <ThumbContainer>
            <Thumb
              src={`https:${thumb.fields.file.url}`}
              alt=""
              width={600}
              height={300}
            />
            <DescriptionContainer>
              <Description>{description || "Acessar postagem"}</Description>
            </DescriptionContainer>
          </ThumbContainer>

          <TitleWrapper>
            <Title>{title}</Title>
            <ArrowIcon id={"link-arrow"} size={16} />
          </TitleWrapper>
        </div>
      </Link>
    </ContentWrapper>
  );
};

export default ContentPost;
