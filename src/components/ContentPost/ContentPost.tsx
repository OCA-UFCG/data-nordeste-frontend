import { IPublication } from "@/utils/interfaces";
import {
  ContentWrapper,
  Link,
  Thumb,
  Title,
  TitleWrapper,
  ArrowIcon,
  DateWrapper,
} from "./ContentPost.styles";

const ContentPost = ({ content }: { content: { fields: IPublication } }) => {
  const { title, thumb, link, date } = content.fields;
  const dateObj = date ? new Date(date) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString("pt-BR") : "";

  return (
    <ContentWrapper>
      <DateWrapper>{formattedDate}</DateWrapper>
      <Link href={link}>
        <Thumb
          src={`https:${thumb.fields.file.url}`}
          alt=""
          width={310}
          height={260}
        />

        <TitleWrapper>
          <Title>{title}</Title>
          <ArrowIcon id={"link-arrow"} size={16} />
        </TitleWrapper>
      </Link>
    </ContentWrapper>
  );
};

export default ContentPost;
