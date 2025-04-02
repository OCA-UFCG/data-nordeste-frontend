"use client";
import { Section } from "@/app/globalStyles";
import { Icon } from "@/components/Icon/Icon";
import styled from "styled-components";

export const Wrapper = styled(Section)``;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
`;

export const RightIcon = styled(Icon)`
  transform: rotate(-90deg);
`;

export const Title = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  transition: 300ms;
`;

export const Subtitle = styled.p`
  margin: 0;
  max-width: 80rem;

  @media screen and (max-width: 600px) {
    text-align: justify;
    text-align-last: center;
  }
`;

export const PanelsContainer = styled.div`
  display: grid;
  flex-wrap: wrap;
  width: 100%;
  justify-content: start;
  padding: 1rem;
  align-items: start;
  gap: 1.5rem;
  row-gap: 3rem;
  grid-template-columns: repeat(4, minmax(20rem, 1fr));

  @media screen and (max-width: 1200px) {
    grid-template-columns: repeat(3, minmax(200px, 1fr));
  }

  @media screen and (max-width: 700px) {
    grid-template-columns: repeat(2, minmax(200px, 1fr));
  }

  @media screen and (max-width: 430px) {
    grid-template-columns: repeat(1, minmax(200px, 1fr));
  }
`;

export const Button = styled.button`
  text-decoration: none;
  border: 1px solid ${({ theme }) => theme.colors.green}80;
  padding: 0.5rem 3rem;
  color: ${({ theme }) => theme.colors.green};
  border-radius: 4px;
  transition: 300ms;
  cursor: not-allowed;
  font-size: 0.8rem;
  background-color: white;

  &:hover {
    background-color: ${({ theme }) => theme.colors.green}90;
    color: white;
  }
`;
