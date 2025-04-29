"use client";
import styled from "styled-components";
import Link from "next/link";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;

  box-sizing: border-box;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  max-width: 1440px;
  gap: 2rem;
`;

export const HeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column;
  justify-content: space-between;
  gap: 1rem;
`;

export const Header = styled.div`
  display: flex;
  width: 100%;
  gap: 0.5rem;
  justify-content: space-between;
  align-items: center;
`;

export const Title = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  transition: 300ms;

  &:hover {
    opacity: 0.6;
  }
`;

export const RightIcon = styled(Icon)`
  transform: rotate(-90deg);
`;

export const Subtitle = styled.p`
  margin: 0;

  @media screen and (max-width: 600px) {
    text-align: justify;
    text-align-last: center;
  }
`;

export const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1440px;
`;

export const Card = styled.li`
  display: flex;
  width: fit-content;
`;
