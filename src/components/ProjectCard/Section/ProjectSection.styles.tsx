"use client";
import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
`;

export const Header = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  gap: 0.25rem;
`;

export const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
`;
export const Subtitle = styled.p`
  max-width: 50rem;
  text-align: center;
  padding: 0 1rem;
`;

export const Projects = styled.div`
  display: flex;
  gap: 1rem;
  max-width: 100%;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;

  @media screen and (max-width: 800px) {
    flex-flow: column;
    align-items: center;
  }
`;
