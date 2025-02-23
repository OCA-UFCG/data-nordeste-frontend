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
import { channels, sections } from "@/utils/constants";

const Footer = () => {
  return (
    <Wrapper>
      <LogoImage id="logo-sudene" width={311} height={100} />
      <Sections>
        <NavSections>
          {Object.entries(sections).map(([key, item]) => (
            <SectionTitle key={key} href={item.path || ""}>
              {item.name}
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
