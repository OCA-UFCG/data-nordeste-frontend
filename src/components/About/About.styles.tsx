"use client";
import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;

  box-sizing: border-box;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-flow: column;
  gap: 1rem;
  width: 100%;
  align-items: center;
  box-sizing: border-box;
  padding: 4rem;
  border-radius: 8px;
  backdrop-filter: blur(5px);
  background-color: ${({ theme }) => theme.colors.green}10;

  @media (max-width: 800px) {
    padding: 3rem 2rem;
  }
`;

export const Title = styled.h2`
  font-size: 1.5rem;
  text-transform: uppercase;
  font-weight: bold;
  text-align: center;
  max-width: 1200px;

  @media (max-width: 800px) {
    font-size: 1.3rem;
  }
`;

export const Subtitle = styled.p`
  margin: 0;
  text-align: center;
  letter-spacing: 1px;
  max-width: 1200px;

  @media (max-width: 800px) {
    font-size: 0.9rem;
  }
`;
