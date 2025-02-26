"use client";

import Image from "next/image";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  max-width: 20rem;
  width: 100%;
  min-width: 16rem;
  gap: 0.5rem;
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

export const InfoWrapper = styled.details`
  display: flex;
  flex-flow: column;
`;

export const Checkbox = styled.input``;

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

export const ExpandIcon = styled(Icon)`
  transition: 300ms;

  ${InfoWrapper}[open] & {
    transform: rotate(180deg);
  }
`;

export const Description = styled.p`
  margin-bottom: 0;
  font-size: 0.8rem;
  transition: 300ms;
  line-height: 1rem;
  margin-top: 0.5rem;

  ${InfoWrapper}[open] > & {
    animation: fall 1000ms ease-in-out;
  }

  ${InfoWrapper}:not([open]) > & {
    animation: close 1000ms ease-in-out;
  }
`;
