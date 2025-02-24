"use client";
import { Icon } from "@/components/Icon/Icon";
import styled from "styled-components";

export const LogoImage = styled(Icon)`
  @media (max-width: 800px) {
    max-width: 70vw;
  }
`;

export const ContentWrapper = styled.div<{ reduced: boolean }>`
  display: flex;
  flex-direction: ${({ reduced }) => (reduced ? "row" : "column")};
  align-items: center;
  justify-content: center;
  gap: ${({ reduced }) => (reduced ? "1rem" : "2rem")};
  flex-wrap: wrap;
  width: ${({ reduced }) => (reduced ? "auto" : "50vw")};
  max-width: 80vw;

  @media (max-width: 800px) {
    justify-content: center;
    gap: ${({ reduced }) => (reduced ? "1rem" : "0")};
    width: 80vw;
  }
`;
