"use client";
import Link from "next/link";
import styled from "styled-components";

export const Wrapper = styled.div`
  padding: 2rem;
`;

export const Title = styled.div`
  font-weight: bold;
`;

export const TitleWrapper = styled.div`
  display: flex;
  width: 100%;
  margin-bottom: 1rem;
  justify-content: space-between;
  align-items: center;
`;

export const Button = styled(Link)`
  width: max-content;
  white-space: nowrap;
  cursor: not-allowed;
  transition: 300ms;

  &:hover {
    opacity: 0.6;
  }
`;

export const EmbedContainer = styled.div`
  width: 100rem;
  height: 50rem;
  border-radius: 0.5rem;
  border: 2px solid ${({ theme }) => theme.colors.green};

  .reportClass {
    width: 100%;
    height: 100%;
  }
`;
