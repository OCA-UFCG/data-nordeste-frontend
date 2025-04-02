import styled from "styled-components";
import Header from "../Header";
import Image from "next/image";

export const Wrapper = styled.div`
  display: flex;
  width: 100%;
  top: 0;
  left: 0;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  box-sizing: border-box;
  position: fixed;
  z-index: 2;
  pointer-events: none;
`;

export const Logo = styled(Image)`
  width: 3rem;
  height: 3rem;
  pointer-events: all;

  @media screen and (min-width: 1000px) {
    display: none;
  }
`;

export const MainHeader = styled(Header)`
  @media screen and (max-width: 1000px) {
    display: none;
  }
`;
