"use client";
import styled from "styled-components";

export const BannerContainer = styled.header`
  width: 100%;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.green};
  padding-bottom: 1rem;
  border-radius: 0 0 8px 8px;

  @media (max-width: 1000px) {
    height: clamp(80px, 20vw, 140px);
  }
`;

export const Banner = styled.img`
  width: 100%;
  height: 100%;
  max-height: 20rem;
  object-fit: cover;
  object-position: center;
  display: block;
`;
