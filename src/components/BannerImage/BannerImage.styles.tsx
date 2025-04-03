"use client";
import styled from "styled-components";

export const BannerContainer = styled.header`
  width: 100%;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.green};
  padding-bottom: 1rem;
  border-radius: 0 0 8px 8px;
  position: relative; /* Adicionado para posicionar a tarja */

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

export const BannerOverlay = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  right: 0.5rem;
  bottom: 0.5rem;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0 2rem;
`;

export const TextButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
`;

export const OverlayText = styled.h2`
  max-width: 50%;
  color: white;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  text-align: left;
  font-family: "League Spartan", sans-serif;

  @media (max-width: 1000px) {
    font-size: 1rem;
    margin: 0 0 0.5rem 0;
    max-width: 100%;
  }
`;

export const OverlayButton = styled.button`
  background-color: transparent;
  color: white;
  border: 2px solid white;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: white;
    color: black;
  }

  @media (max-width: 768px) {
    padding: 0.3rem 1rem;
    font-size: 0.8rem;
    border-width: 1px;
  }

  @media (max-width: 480px) {
    padding: 0.2rem 0.8rem;
    font-size: 0.7rem;
  }
`;
