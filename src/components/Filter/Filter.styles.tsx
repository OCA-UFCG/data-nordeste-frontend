"use client";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  width: 100%;
  justify-content: center;
  align-items: center;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
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
