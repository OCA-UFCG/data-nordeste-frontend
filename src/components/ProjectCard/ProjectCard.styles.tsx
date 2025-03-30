"use client";

import Image from "next/image";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  display: flex;
  flex-flow: row;
  gap: 0.5rem;

  @media (max-width: 768px) {
    flex-flow: column;
  }
`;

export const Thumb = styled(Image)`
  border-radius: 4px;
  width: 100%;
  max-width: 20rem;
  height: auto;
  transition: 300ms;
  display: block;
`;

export const InfoWrapper = styled.summary`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  max-width: 19rem;
  gap: 0.5rem;
  cursor: pointer;
  transition: 0.3s;
  padding: 0.5rem;
`;

export const ArrowIcon = styled(Icon)`
  flex-shrink: 0;
  height: 1.3rem;
`;

export const TextWrapper = styled.div`
  display: flex;
  flex-flow: column;
  gap: 0.5rem;
  width: 100%;
`;

export const Title = styled.h3`
  font-weight: bold;
  font-size: 1.1rem;
  margin: 0;
  color: #333;
`;

export const Description = styled.p`
  margin: 0;
  font-size: 0.9rem;
  transition: 300ms;
  line-height: 1.2rem;
  color: #555;
`;

export const Button = styled.button`
  text-decoration: none;
  border: 1px solid ${({ theme }) => theme.colors.green}80;
  color: ${({ theme }) => theme.colors.green};
  border-radius: 4px;
  transition: 300ms;
  cursor: pointer;
  font-size: 0.8rem;
  width: 100%;
  padding: 0.2rem 0rem;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.green}90;
    color: white;
  }
`;
