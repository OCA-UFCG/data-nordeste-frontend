"use client";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const SortContainer = styled.div`
  display: flex;
  justify-content: center;
`;

export const Summary = styled.summary`
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid #cdcdcd;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #f2f2f2;
  }
`;

export const OrderIcon = styled(Icon)``;

export const Wrapper = styled.div`
  padding-top: 0.5rem;
  position: absolute;
  background-color: transparent;
  width: 100%;
  height: 100%;
`;

export const SortOptions = styled.div<{ isOpen: boolean }>`
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid #cdcdcd;
  border-radius: 0.25rem;
  box-shadow: 0 0.5rem 0.5rem #cbcaca;
  display: ${({ isOpen }) => (isOpen ? "block" : "none")};

  @media (min-width: 768px) {
    display: none;
  }
`;

export const SortDetails = styled.div`
  position: relative;

  @media (min-width: 768px) {
    &:hover ${SortOptions} {
      display: block;
    }
  }
`;

export const ExpandIcon = styled(Icon)<{ isOpen: boolean }>`
  transition: 200ms;
  transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};

  @media (min-width: 800px) {
    ${SortDetails}:hover & {
      transform: rotate(180deg);
    }
  }
`;
export const SortOption = styled.div`
  padding: 0.5rem;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    font-weight 0.3s ease;

  &:hover {
    background-color: #f4f4f4;
    font-weight: bold;
  }
`;
