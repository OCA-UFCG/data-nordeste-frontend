"use client";
import { Section } from "@/app/globalStyles";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

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
  max-width: 45rem
`;

export const ContentWrapper = styled.div<{ reduced: boolean }>`
  display: flex;
  flex-direction: ${({ reduced }) => (reduced ? "row" : "column")};
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: 1000px) {
    justify-content: center;
    gap: ${({ reduced }) => (reduced ? "1rem" : "1.5rem")};
    width: auto;
  }
`;

export const LogoImage = styled(Icon)<{ reduced: boolean }>`
  @media (max-width: 800px) {
    width: ${({ reduced }) => (reduced ? "4rem" : "15rem")};
    height: auto;
  }
`;

export const SectionTitle = styled.h2<{ reduced: boolean }>`
  font-size: ${({ reduced }) => (reduced ? "1.5rem" : "2rem")};
  font-weight: ${({ reduced }) => (reduced ? "700" : "900")};
  text-align: center;
  letter-spacing: 5%;
  width: fit-content;
  color: ${({ theme }) => theme.colors.black};
`;

export const SubTitle = styled.h2`
  color: ${({ theme }) => theme.colors.black};
  align-self: center;
  text-align: center;
  width: fit-content;
  font-size: 1.5rem;
  font-weight: 500;
  font-style: italic;
`;
