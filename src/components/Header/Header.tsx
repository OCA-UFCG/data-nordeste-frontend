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
import { sections } from "@/utils/constants";

const Header = (props?: any) => {
  return (
    <Wrapper {...props}>
      <LogoContainer href="/">
        <Logo src="/logo.png" alt="datane logo" width={45} height={45} />
        <Name>Data Nordeste</Name>
      </LogoContainer>
      <Navbar>
        <NavList>
          {Object.entries(sections).map(([key, item]) => (
            <Dropdown item={item} key={key} />
          ))}
        </NavList>
      </Navbar>
      <LogoContainer href="/">
        <Gov src="/gov.png" alt="datane logo" width={110} height={40} />
      </LogoContainer>
    </Wrapper>
  );
};

export default Header;
