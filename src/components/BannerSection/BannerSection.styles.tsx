"use client";
import { Section } from "@/app/globalStyles";
import styled from "styled-components";

export const Wrapper = styled(Section)`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
  width: 50vw;

  @media (max-width: 800px) {
    width: 80vw;
    height: 100vh;
  }
`;
