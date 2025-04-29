"use client";

import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
`;

export const SlidesContainer = styled.div`
  width: 100%;
  max-width: 1200px;
`;

export const Slides = styled.ul`
  display: flex;
  justify-content: center;
`;

export const Button = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  backdrop-filter: blur(40px);
  color: ${({ theme }) => theme.colors.black};
  background-color: #ffffff80;
  height: 2rem;
  width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 300ms;
  box-shadow: 0 2px 4px ${({ theme }) => theme.colors.gray};

  &:hover {
    background-color: #ffffff;
  }

  svg {
    min-width: 0.75rem;
  }

  &.glide__arrow--left {
    left: 3rem;
  }

  &.glide__arrow--right {
    right: 3rem;
  }
`;

export const LeftIcon = styled(Icon)`
  transform: rotate(90deg);
`;

export const RightIcon = styled(Icon)`
  transform: rotate(-90deg);
`;
