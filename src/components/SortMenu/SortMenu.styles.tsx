"use client";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  box-sizing: border-box;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.55rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.black}50;
  border-radius: 4px;
  box-sizing: border-box;
  justify-content: center;
`;

export const Expand = styled(Icon)``;

export const Text = styled.span`
  line-height: 0.75rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TextContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

export const Content = styled.div`
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  position: absolute;
  top: 2.1rem;
  left: 0;
  z-index: 1;
  background: white;
  border-radius: 4px;
  display: none;
  box-shadow: 0px 0px 4px #cdcdcd;

  ${Wrapper}:hover & {
    display: flex;
  }
`;

export const ContentWrapper = styled.ul`
  list-style: none;
  margin: 0;
  display: flex;
  flex-flow: column;
  gap: 0.5rem;
`;

export const ContentItem = styled.li`
  transition: 300ms;
  cursor: pointer;
  margin: 0;

  &:hover {
    opacity: 0.6;
  }
`;
