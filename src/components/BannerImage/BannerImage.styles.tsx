"use client";
import styled from "styled-components";

export const BannerContainer = styled.header`
  width: 100%;
  position: relative;
  overflow: hidden;

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
  object-fit: cover;
  object-position: center;
  display: block;
`;

export const GreenStrip = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1.5rem;
  background-color: ${({ theme }) => theme.colors.green};
  border-radius: 0 0 20px 20px;

  @media (max-width: 480px) {
    height: 30px;
    border-radius: 0 0 15px 15px;
  }
`;
