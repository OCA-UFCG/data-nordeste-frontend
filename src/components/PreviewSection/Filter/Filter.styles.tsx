"use client";
import { Icon } from "@/components/Icon/Icon";
import styled from "styled-components";

export const FilterWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  min-width: 8rem;
`;

export const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid ${({ theme }) => theme.colors.black}50;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  gap: 0.5rem;
  width: 100%;
`;

export const Title = styled.span``;
export const Expand = styled(Icon)`
  transition: transform 0.3s ease;

  ${FilterWrapper}:hover & {
    transform: rotate(180deg);
  }
`;

export const FilterContent = styled.div`
  position: absolute;
  top: 2.4rem;
  width: 100%;
  z-index: 3;
  right: 0;
  background: white;
  border-radius: 4px;
  display: none;
  box-shadow: 0px 0px 4px #cdcdcd;
  min-width: 12rem;

  ${FilterWrapper}:hover & {
    display: block;
  }
`;

export const FilterList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 0;
  padding: 1rem 1rem 0 1rem;
`;

export const RegionTitle = styled.span`
  font-weight: 600;
  margin-top: 0.5rem;
  cursor: pointer;

  &:hover {
    opacity: 0.7;
  }
`;

export const StateItem = styled.li`
  list-style: none;
  margin: 0;
  cursor: pointer;

  &:hover {
    opacity: 0.6;
  }
`;
