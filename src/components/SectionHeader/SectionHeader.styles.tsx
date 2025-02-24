"use client";

import styled from "styled-components";

export const Wrapper = styled.div<{ alignment: string }>`
  display: flex;
  flex-flow: column;
  gap: 2rem;
  align-items: ${({ alignment }) => alignment};
`;

export const SubTitle = styled.h2<{
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  letterSpacing: string;
}>`
  color: #242424;
  align-self: center;
  text-align: center;
  width: fit-content;
  font-size: ${({ fontSize }) => fontSize};
  font-weight: ${({ fontWeight }) => fontWeight};
  font-style: ${({ fontStyle }) => fontStyle};
  letter-spacing: ${({ letterSpacing }) => letterSpacing};
`;
