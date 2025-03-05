"use client";

import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
`;

export const SlidesContainer = styled.div``;

export const Slides = styled.ul`
  @media screen and (min-width: 1200px) {
    display: flex;
    justify-content: center;
  }
`;

export const Card = styled.li`
  display: flex;
  width: fit-content;
`;

export const Button = styled.button`
  display: flex;
  backdrop-filter: blur(40px);
  color: ${({ theme }) => theme.colors.black};
  background-color: #ffffff70;
  height: 2rem;
  width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 300ms;

  &:hover {
    background-color: #ffffff;
  }

  svg {
    min-width: 0.5rem;
    min-height: 0.5rem;
  }
`;

export const LeftIcon = styled(Icon)`
  transform: rotate(90deg);
`;

export const RightIcon = styled(Icon)`
  transform: rotate(-90deg);
`;
