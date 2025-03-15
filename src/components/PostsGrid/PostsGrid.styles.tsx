"use client";

import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
`;

export const PostsContainer = styled.div`
  display: grid;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  max-width: 1440px;
  grid-template-columns: repeat(4, minmax(20rem, 1fr));
  gap: 2rem;
  padding: 2rem;
  box-sizing: border-box;
  background-color: ${({ theme }) => theme.colors.green}10;
  backdrop-filter: blur(20px);
  border-radius: 8px;

  @media screen and (max-width: 1400px) {
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

export const LoadingWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  width: 100%;
  height: 100%;

  @media (max-width: 1200px) {
    margin: 13rem auto;
  }
`;

export const LoadingIcon = styled(Icon)`
  opacity: 0.7;
  animation: spin 1s linear infinite;
`;

export const SkeletonCard = styled.div`
  width: 100%;
  aspect-ratio: 5/4;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;

  background: linear-gradient(100deg, #e0e0e0 20%, #f0f0f0 50%, #e0e0e0 80%);
  background-size: 200% 100%;
  animation: loading 3s infinite linear;
  border-radius: 5px;
`;

export const ImageCont = styled.div`
  width: 100%;
  aspect-ratio: 2/1;
  background: linear-gradient(100deg, #e0e0e0 20%, #f0f0f0 50%, #e0e0e0 80%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite linear;
  border-radius: 5px;
`;

export const Title = styled.div`
  height: 20px;
  width: 70%;
  background: linear-gradient(100deg, #e0e0e0 20%, #f0f0f0 50%, #e0e0e0 80%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite linear;
  border-radius: 5px;
`;
