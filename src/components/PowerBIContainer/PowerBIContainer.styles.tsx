"use client";
import styled from "styled-components";

export const Wrapper = styled.div`
  padding: 1rem;
  width: 100%;
  max-width: 100rem;
  justify-content: center;
  box-sizing: border-box;
`;

export const TitleWrapper = styled.div`
  display: flex;
  width: 100%;
  margin-bottom: 1rem;
  justify-content: space-between;
  align-items: center;
`;

export const Title = styled.div`
  font-weight: bold;
  font-size: 1.3rem;
`;

export const EmbedContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.white};
  width: 100%;
  height: 45rem;
  border-radius: 0.5rem;
  box-sizing: border-box;

  @media (max-width: 1200px) {
    display: block;
    overflow-x: auto;
    overflow-y: hidden;
    height: 30rem;
  }

  .reportClass {
    width: 100%;
    height: 100%;

    @media (max-width: 800px) {
      width: 45rem;
      object-fit: contain;
    }
  }
`;
