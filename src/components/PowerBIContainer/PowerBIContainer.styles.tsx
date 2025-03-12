"use client";
import Link from "next/link";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  padding: 2rem;
  width: 100%;
  max-width: 100rem;
  justify-content: center;
`;

export const TitleWrapper = styled.div`
  display: flex;
  width: 100%;
  margin-bottom: 1rem;
  justify-content: space-between;
  align-items: center;

    @media (max-width: 1200px) {
    margin: 1rem;
  }
`;

export const Title = styled.div`
  font-weight: bold;
  font-size: 1.3rem;
`;

export const Button = styled(Link)`
  width: max-content;
  white-space: nowrap;
  cursor: not-allowed;
  transition: 300ms;

  &:hover {
    opacity: 0.6;
  }
`;

export const EmbedContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1rem;
  width: 100%;
  height: 45rem;
  border-radius: 0.5rem;
  border: 2px solid ${({ theme }) => theme.colors.green};
  box-sizing: border-box;
  
  @media (max-width: 1200px) {
    overflow: auto;
    height: 30rem;
  }

 .reportClass {
    width: 100%;
    height: 100%;

    @media (max-width: 800px) {
      width: 45rem;
      object-fit: contains;
    }
  }
`;

export const LoadingIcon = styled(Icon)<{ loading: boolean }>`
  opacity: 0.7;
  animation: spin 1s linear infinite;
  display: ${({ loading }) => (loading ? "block" : "none")};
`;
