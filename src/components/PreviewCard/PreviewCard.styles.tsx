"use client";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Header = styled.div`
  display: flex;
  flex-flow: column;
  gap: 0.2rem;
  align-items: center;
  flex-grow: 2;
  height: 100%;
`;

export const TitleWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  cursor: pointer;
`;

export const Title = styled.h3`
  font-weight: bold;
  font-size: 1.3rem;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.orange};
`;

export const Subtitle = styled.p`
  margin: 0;
  text-align: center;
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1;
`;

export const ArrowIcon = styled(Icon)`
  flex-shrink: 0;
  height: 1.3rem;
  color: ${({ theme }) => theme.colors.orange};
`;

export const Link = styled.a`
  text-decoration: none;
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

  &:hover {
    border-color: ${({ theme }) => theme.colors.green}70;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-radius: 8px;
  flex-grow: 2;
  gap: 0.5rem;
  height: 100%;
`;

export const Data = styled.div`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.green};
  font-weight: bolder;
`;

export const Note = styled.p`
  margin: 0;
  text-align: center;
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1;
`;
