import {
  Wrapper,
  Divider,
  Sections,
  NavSections,
  SectionTitle,
  SocialMedia,
  SocialMediasContainer,
  LogoImage,
  SocialMediaName,
} from "./Footer.styles";
import { Icon } from "../Icon/Icon";
import { channels } from "@/utils/constants";
import { ISection } from "@/utils/interfaces";

const Footer = ({ content }: { content: { fields: ISection }[] }) => {
  const filteredData = content
    .filter((item) => item.fields.appears)
    .sort((a, b) => a.fields.name.localeCompare(b.fields.name))
    .map(({ fields: { name, id, path } }) => ({ name, id, path }));

  return (
    <Wrapper>
      <LogoImage id="logo-sudene" width={311} height={100} />
      <Sections>
        <NavSections>
          {filteredData.map(({ id, path, name }) => (
            <SectionTitle key={id} href={path}>
              {name}
            </SectionTitle>
          ))}
        </NavSections>
        <Divider />
        <SocialMediasContainer>
          {channels.map(({ href, icon, size, name }, index) => (
            <SocialMedia target="_blank" key={index} title={href} href={href}>
              <Icon id={icon} size={size} />
              <SocialMediaName>{name}</SocialMediaName>
            </SocialMedia>
          ))}
        </SocialMediasContainer>
      </Sections>
    </Wrapper>
  );
};

export default Footer;
