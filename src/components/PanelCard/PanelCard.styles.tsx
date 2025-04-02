"use client";

import Image from "next/image";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  max-width: 20rem;
  min-height: 30rem;
`;
export const Description = styled.p`
  color: white;
  font-size: 1rem;
  text-align: center;
  padding: 1rem;
`;

export const DescriptionContainer = styled.div`
  position: absolute;
  overflow-y: scroll;
  background-color: #00000090;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  top: 0;
  display: none;
  animation: fadeIn 300ms linear forwards;
  align-items: center;
  justify-content: center;
`;

export const ThumbContainer = styled.div`
  position: relative;
  aspect-ratio: 16 / 19;
  width: 100%;
  height: 100%;

  &:hover ${DescriptionContainer} {
    display: flex;
  }
`;

export const Link = styled.a`
  overflow: hidden;
  width: 100%;
  height: auto;
  margin: 0;
  padding: 0;
  text-decoration: none;
`;

export const Thumb = styled(Image)`
  border-radius: 4px;
  width: 100%;
  height: 100%;
  transition: 300ms;
  display: block;
  object-position: top;

  &:hover {
    transform: scale(1.05);
  }
`;

export const ArrowIcon = styled(Icon)`
  flex-shrink: 0;
  height: 1.3rem;
`;

export const InfoWrapper = styled.div`
  display: flex;
  flex-flow: column;
  padding: 1rem;
`;

export const TitleWrapper = styled.summary`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 1rem;
  justify-content: space-between;
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    opacity: 0.6;
  }
`;

export const Title = styled.h3`
  font-weight: bold;
`;

