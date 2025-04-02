"use client";
import styled from "styled-components";

export const BannerContainer = styled.header`
  width: 100%;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.green};
  padding-bottom: 1rem;
  border-radius: 0 0 8px 8px;

  @media (max-width: 768px) {
    height: 300px;
  }

  @media (max-width: 480px) {
    height: 200px;
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
