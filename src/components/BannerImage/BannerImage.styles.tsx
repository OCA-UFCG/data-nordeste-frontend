"use client";
import styled from "styled-components";

export const BannerContainer = styled.header`
  width: 100%;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.green};
  padding-bottom: 1rem;
  border-radius: 0 0 8px 8px;
  position: relative;

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
  top: 0;
  left: 0;
  right: 0rem;
  bottom: 0rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0 2rem;
  padding-bottom: 1.5rem;
`;

export const TextButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 0.75rem;
`;

export const OverlayText = styled.h2`
  max-width: 50%;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  text-align: left;
  color: #505050;
  font-family: "League Spartan", sans-serif;

  @media (max-width: 1000px) {
    font-size: 1rem;
    margin: 0 0 0.5rem 0;
    max-width: 100%;
  }

  margin-bottom: 0.5rem;
`;

export const OverlayButton = styled.label`
  text-decoration: none;
  border: 2px solid ${({ theme }) => theme.colors.green}80;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.colors.green};
  border-radius: 4px;
  transition: 300ms;
  cursor: pointer;
  font-size: 0.8rem;
  background-color: white;
  width: fit-content;
  justify-content: center;
  display: flex;
  box-sizing: border-box;
  font-weight: bold;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.colors.green}90;
    color: white;
  }

  @media screen and (max-width: 650px) {
    width: 100%;
  }
`;
