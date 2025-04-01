"use client";

import Image from "next/image";
import styled from "styled-components";

export const Card = styled.li`
  display: flex;
  height: 100%;
  width: fit-content;
`;

export const Header = styled.div`
  padding: 0 5rem;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Logo = styled(Image)``;
export const Name = styled.span``;

export const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const Wrapper = styled.section`
  width: 100%;
  max-width: 1440px;
  display: flex;
  flex-flow: column;
  justify-content: center;
  box-sizing: border-box;
  gap: 1rem;
  height: 100%;

  & .out-control {
    padding: 0 5rem;
  }

  & .glide__slides {
    height: 10rem;
  }
`;
