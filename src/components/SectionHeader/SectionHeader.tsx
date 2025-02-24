import { SectionTitle } from "@/app/globalStyles";
import { SubTitle, Wrapper } from "./SectionHeader.styles";
import { ISectionHeader } from "@/utils/interfaces";

export const SectionHeader = ({
  id,
  sectionHead,
  alignment = "center",
  titleFontSize = "1.75rem",
  subtitleFontSize = "1rem",
  titleFontWeight = "500",
  subtitleFontWeight = "500",
  titleFontStyle = "normal",
  subtitleFontStyle = "normal",
  letterSpacingSub = "5%",
  reduced = false,
}: {
  id: string;
  alignment?: "start" | "center" | "end";
  sectionHead: ISectionHeader[];
  titleFontSize?: string;
  subtitleFontSize?: string;
  titleFontWeight?: string;
  subtitleFontWeight?: string;
  titleFontStyle?: string;
  subtitleFontStyle?: string;
  letterSpacingSub?: string;
  reduced?: boolean;
}) => {
  const header = sectionHead?.find(
    (head: ISectionHeader) => head.fields.id === id,
  );

  const { title, subtitle } = header?.fields || {
    title: "",
    subtitle: undefined,
  };

  return (
    <Wrapper alignment={alignment}>
      <SectionTitle
        fontSize={reduced ? "1.5rem" : titleFontSize}
        fontWeight={titleFontWeight}
        fontStyle={titleFontStyle}
        reduced={reduced}
      >
        {title}
      </SectionTitle>
      {!reduced && subtitle && (
        <SubTitle
          fontSize={subtitleFontSize}
          fontWeight={subtitleFontWeight}
          fontStyle={subtitleFontStyle}
          letterSpacing={letterSpacingSub}
        >
          {subtitle}
        </SubTitle>
      )}
    </Wrapper>
  );
};
