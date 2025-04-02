"use client";
import styled from "styled-components";
import Image from "next/image";
import { Icon } from "../Icon/Icon";

export const Type = styled.span`
  width: 100%;
  font-size: 0.8rem;
`;

export const DateWrapper = styled.div`
  min-height: 1.5rem;
  text-align: right;
  font-size: 0.8rem;
  width: 100%;
  height: 100%;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
`;

export const TitleWrapper = styled.div`
  display: flex;
  width: 100%;
  margin-top: 0.5rem;
  gap: 1rem;
  justify-content: space-between;
  cursor: pointer;
`;

export const Title = styled.h3`
  font-weight: bold;
  text-align: left;
`;

export const ArrowIcon = styled(Icon)`
  flex-shrink: 0;
  height: 1.3rem;
`;

export const Link = styled.a`
  text-decoration: none;
`;

export const Thumb = styled(Image)`
  object-fit: cover;
  object-position: top;
  transition: 300ms;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  box-shadow: 0 0 0.5rem #cbcaca;
  border: 0.1rem solid #cbcaca;
  position: absolute;
  border-radius: 0.5rem;

  &:hover {
    transform: scale(1.02);
  }
`;

export const Description = styled.p`
  color: white;
  font-size: 1rem;
  text-align: center;
  align-content: center;
  height: 100%;
`;

export const DescriptionContainer = styled.div`
  position: absolute;
  padding: 1rem;
  overflow-y: scroll;
  background-color: #00000090;
  height: 100%;
  width: 100%;
  border-radius: 0.5rem;
  display: none;
  animation: fadeIn 300ms linear forwards;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow-y: scroll;
`;

export const ThumbContainer = styled.div`
  position: relative;
  aspect-ratio: 16/9;
  width: 100%;
  height: 100%;

  &:hover ${DescriptionContainer} {
    display: flex;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  &:hover ${TitleWrapper} {
    opacity: 0.6;
    transition: 200ms;
  }
`;
