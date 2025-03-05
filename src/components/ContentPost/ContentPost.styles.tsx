"use client";
import styled from "styled-components";
import Image from "next/image";
import { Icon } from "../Icon/Icon";

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 19rem;
  max-height: 22rem;
  width: 100%;
`;

export const DateWrapper = styled.div`
  min-height: 1.5rem;
  text-align: right;
  font-size: 0.8rem;
`;

export const TitleWrapper = styled.summary`
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 0.5rem;
  gap: 1rem;
  justify-content: space-between;
  cursor: pointer;

  &:hover {
    opacity: 0.6;
    transition: 200ms;
  }
`;

export const Title = styled.h3`
  font-weight: bold;
  text-align: left;
`;

export const ArrowIcon = styled(Icon)`
  flex-shrink: 0;
`;

export const Link = styled.a`
  text-decoration: none;
`;

export const Thumb = styled(Image)`
  object-fit: cover;
  object-position: top;
  transition: 300ms;
  border-radius: 0.5rem;
  box-shadow: 0.5rem 0.5rem 1rem #cbcaca;
  border: 0.1rem solid #cbcaca;

  &:hover {
    transform: scale(1.02);
  }
`;
