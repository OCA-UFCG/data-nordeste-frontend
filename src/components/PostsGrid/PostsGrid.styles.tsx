"use client";

import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
`;

export const PostsContainer = styled.div`
  display: grid;
  flex-wrap: wrap;
  width: 100%;
  max-width: 1440px;
  min-height: 40rem;
  grid-template-columns: repeat(4, minmax(200px, 1fr));
  gap: 2rem;
  padding: 2rem;
  box-sizing: border-box;
  background-color: ${({ theme }) => theme.colors.green}10;
  backdrop-filter: blur(20px);
  border-radius: 8px;

  @media screen and (max-width: 1000px) {
    grid-template-columns: repeat(3, minmax(200px, 1fr));
  }

  @media screen and (max-width: 800px) {
    grid-template-columns: repeat(2, minmax(200px, 1fr));
  }

  @media screen and (max-width: 600px) {
    grid-template-columns: repeat(1, minmax(200px, 1fr));
  }
`;

export const Post = styled.div`
  width: 100%;
`;

export const Pagination = styled.div`
  display: flex;
  gap: 1rem;
`;

export const PaginationButton = styled.button<{ selected?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0.5rem 0.5rem;
  border: 2px solid ${({ theme }) => theme.colors.green};
  background-color: white;
  border-radius: 4px;
  transition: 300ms;

  &:disabled {
    background-color: ${({ theme, selected }) =>
      selected ? theme.colors.green : `${theme.colors.gray}20`};
    border-color: ${({ theme, selected }) =>
      selected ? theme.colors.green : `${theme.colors.gray}40`};
    color: ${({ theme, selected }) =>
      selected ? "white" : `${theme.colors.gray}70`};
    font-weight: bold;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    cursor: pointer;

    background-color: ${({ theme }) => theme.colors.green};
    color: white;
    font-weight: bold;
  }
`;

export const LeftIcon = styled(Icon)`
  transform: rotate(90deg);
`;

export const RightIcon = styled(Icon)`
  transform: rotate(-90deg);
`;
