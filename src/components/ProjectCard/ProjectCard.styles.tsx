"use client";

import Image from "next/image";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  display: flex;
  flex-flow: row;
  width: 100%;
  height: 100%;
  gap: 1rem;
  justify-content: space-between;
  max-width: 700px;

  @media (max-width: 675px) {
    flex-flow: column;
  }
`;

export const Link = styled.a`
  text-decoration: none;
  width: 100%;
  height: auto;
`;

export const ThumbContainer = styled.div`
  position: relative;
  aspect-ratio: 16/9;
  width: 100%;
  height: auto;
`;

export const Thumb = styled(Image)`
  border-radius: 4px;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: 300ms;
  display: block;

  &:hover {
    transform: scale(1.05);
  }
`;

export const InfoWrapper = styled.summary`
  display: flex;
  flex-flow: column;
  justify-content: space-between;
  width: 100%;
  gap: 0.5rem;
  cursor: pointer;
  transition: 0.3s;
  align-items: center;
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

export const ArrowIcon = styled(Icon)`
  flex-shrink: 0;
  height: 1.3rem;
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
