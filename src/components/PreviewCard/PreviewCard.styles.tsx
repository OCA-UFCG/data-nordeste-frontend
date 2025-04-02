"use client";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";
import DefaultLink from "next/link";

export const Header = styled.div`
  display: flex;
  flex-flow: column;
  gap: 0.2rem;
  align-items: center;
  height: 100%;
`;

export const TitleWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  cursor: pointer;
`;

export const Title = styled.h3`
  font-weight: bold;
  font-size: 1.3rem;
  text-transform: uppercase;
  text-align: center;
  color: ${({ theme }) => theme.colors.orange};
`;

export const Subtitle = styled.p`
  margin: 0;
  text-align: center;
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1;
  max-height: 3rem;
  overflow-y: hidden;
`;

export const ArrowIcon = styled(Icon)`
  flex-shrink: 0;
  height: 1.5rem;
  color: ${({ theme }) => theme.colors.orange};
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-radius: 8px;
  gap: 0.5rem;
  height: 100%;
`;

export const Data = styled.div`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.green};
  font-weight: bolder;
`;

export const Note = styled.p`
  max-height: 3rem;
  overflow-y: hidden;
  margin: 0;
  text-align: center;
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1;
`;

export const Link = styled(DefaultLink)`
  text-decoration: none;
  font-weight: normal;
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 3px solid #ddd;
  box-shadow: 0px 2px 4px #00000025;
  padding: 1rem;
  gap: 1rem;

  transition: 300ms;

  &:hover {
    border-color: ${({ theme }) => theme.colors.green}70;
  }
`;
