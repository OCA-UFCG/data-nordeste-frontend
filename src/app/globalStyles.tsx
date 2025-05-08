"use client";

import Link from "next/link";
import Image from "next/image";
import styled, { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  .maplibregl-popup-content, .maplibregl-popup-tip {
    background-color: transparent;
    box-shadow: none;
    border-top-color: transparent;
  }

  .maplibregl-popup-content {
    width: 13rem;
  }

  .maplibregl-popup-tip {
    visibility: hidden;
  }
`;

export const ContentContainer = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  width: 100%;
  min-height: 100svh;
  box-sizing: border-box;
  background-size: 150vw;
  background-repeat: repeat;
  justify-content: space-between;
`;

export const Main = styled.main<{ $backThumb: string }>`
  display: flex;
  flex-flow: column;
  align-items: center;
  width: 100%;
  gap: 2rem;

  box-sizing: border-box;
  transition: 0.3s;
`;

export const Section = styled.section<{ $full?: string }>`
  padding: 1rem 1rem;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 1.5rem;
  box-sizing: border-box;
  width: 100%;
  max-width: ${({ $full }) =>
    $full !== "false" ? "100%" : "var(--main-section-width)"};
`;

export const SectionTitle = styled.h2<{
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  reduced: boolean;
}>`
  font-size: ${({ fontSize }) => fontSize};
  font-weight: ${({ fontWeight }) => fontWeight};
  text-align: center;
  padding-bottom: 0.25rem;
  letter-spacing: 5%;
  width: fit-content;
  color: ${({ theme }) => theme.colors.black};
`;

export const LinkButton = styled(Link)`
  background-color: ${({ theme }) => theme.colors.maroon};
  color: ${({ theme }) => theme.colors.white};
  padding: 0.5rem 2rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  text-align: center;
  max-width: 12rem;
  transition: 0.3s;
  text-decoration: none;
  font-size: 14px;

  &:hover {
    opacity: 0.7;
    transform: scale(0.97);
  }
`;

export const LogoSection = styled.div`
  display: flex;
  align-items: center;
  height: 50svh;
`;

export const ArticleImage = styled(Image)`
  max-width: 32rem;
  width: 100%;
  margin-bottom: 1rem;
  align-self: center;
  border-radius: 4px;
  height: fit-content;
`;
