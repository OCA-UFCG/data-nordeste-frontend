import { ISection } from "@/utils/interfaces";
import {
  Logo,
  NavList,
  Navbar,
  Wrapper,
  Name,
  LogoContainer,
  Gov,
} from "./Header.styles";
import { Dropdown } from "@/components/Dropdown/Dropdown";

const Header = ({
  title,
  content,
  ...props
}: {
  title: string;
  content: { fields: ISection }[];
  props?: any;
}) => {
  return (
    <Wrapper {...props}>
      <LogoContainer href="/">
        <Logo src="/logo.png" alt="datane logo" width={45} height={45} />
        <Name>{title}</Name>
      </LogoContainer>
      <Navbar>
        <NavList>
          {content
            .sort((a, b) => a.fields.name.localeCompare(b.fields.name))
            .filter((a) => a.fields.appears)
            .map((item, key) => (
              <Dropdown item={item} key={key} />
            ))}
        </NavList>
      </Navbar>
      <LogoContainer target="_blank" href="https://www.gov.br/sudene/pt-br">
        <Gov src="/gov.png" alt="datane logo" width={110} height={40} />
      </LogoContainer>
    </Wrapper>
  );
};

export default Header;
