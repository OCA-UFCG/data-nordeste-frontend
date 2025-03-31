"use client";

import Image from "next/image";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  width: 26rem;
  border: 1px solid #cbcaca;
  border-radius: 0.5rem;
  box-shadow: 0 0 0.2rem #cbcaca;
  background-color: white;

  @media screen and (max-width: 600px) {
    max-width: 20rem;
  }
`;

export const Link = styled.a`
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0px 0px 2px #616161;
  width: 100%;
  height: auto;
  margin: 0;
  padding: 0;
`;

export const Thumb = styled(Image)`
  border-radius: 4px;
  width: 100%;
  height: auto;
  transition: 300ms;
  display: block;

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

export const TitleWrapper = styled.a`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 1rem;
  justify-content: space-between;
  cursor: pointer;
  transition: 0.3s;
  text-decoration: none;

  &:hover {
    opacity: 0.6;
  }
`;

export const Title = styled.h3`
  font-weight: bold;
`;

export const Description = styled.p`
  margin-bottom: 0;
  font-size: 0.8rem;
  transition: 300ms;
  line-height: 1rem;
  margin-top: 0.5rem;
`;
