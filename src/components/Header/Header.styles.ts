import styled from "styled-components";
import Link from "next/link";
import Image from "next/image";

export const Wrapper = styled.div`
  display: flex;
  z-index: 50;
  justify-content: space-between;
  align-items: center;
  width: 100vw;
  box-sizing: border-box;
  pointer-events: none;

  @media screen and (max-width: 1000px) {
    gap: 1rem;
    flex-flow: column;
    width: fit-content;
    padding: 0;
    gap: 0;
  }
`;

export const Logo = styled(Image)`
  height: 3rem;
  width: 3rem;
  pointer-events: all;
`;

export const Name = styled.span`
  text-decoration: none;
  pointer-events: all;
`;

export const LogoContainer = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  width: fit-content;
`;

export const Gov = styled(Image)`
  height: fit-content;
  max-width: 4rem;
  margin-left: 6rem;

  @media screen and (max-width: 1000px) {
    display: none;
  }
`;

export const Navbar = styled.nav`
  backdrop-filter: blur(40px);
  padding: 0.5rem 1.5rem;
  background-color: #ffffff99;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.colors.black}50;
  box-shadow: 0px 0px 4px #cdcdcd;
  pointer-events: all;

  @media screen and (max-width: 1000px) {
    width: 100%;
    display: none;
  }
`;

export const NavList = styled.ul`
  display: flex;
  align-items: flex-end;
  margin: 0;
  gap: 2rem;

  @media screen and (max-width: 1000px) {
    box-sizing: border-box;
    padding: 1rem 0;
    flex-flow: column;
    gap: 1rem;
    align-items: flex-start;
  }
`;
