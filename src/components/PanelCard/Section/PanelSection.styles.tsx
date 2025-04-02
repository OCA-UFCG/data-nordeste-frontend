"use client";
import { Section } from "@/app/globalStyles";
import styled from "styled-components";

export const Wrapper = styled(Section)``;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
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

export const Input = styled.input``;

export const PanelsContainer = styled.ul`
  display: grid;
  flex-wrap: wrap;
  width: 100%;
  padding: 1rem;
  margin: 0;
  gap: 1.5rem;
  row-gap: 3rem;
  grid-template-columns: repeat(5, minmax(200px, 1fr));
  gap: 1rem;

  @media screen and (max-width: 1200px) {
    grid-template-columns: repeat(4, minmax(100px, 1fr));
  }

  @media screen and (max-width: 1000px) {
    grid-template-columns: repeat(3, minmax(100px, 1fr));
  }

  @media screen and (max-width: 675px) {
    grid-template-columns: repeat(2, minmax(100px, 1fr));
  }

  @media screen and (max-width: 340px) {
    grid-template-columns: repeat(1, minmax(100px, 1fr));
  }

  & li:nth-child(n + 6) {
    display: none;
  }

  ${Input}:checked + & li:nth-child(n+6) {
    display: flex;
  }
`;

export const Button = styled.label`
  text-decoration: none;
  border: 2px solid ${({ theme }) => theme.colors.green}80;
  padding: 0.5rem 3rem;
  color: ${({ theme }) => theme.colors.green};
  border-radius: 4px;
  transition: 300ms;
  cursor: pointer;
  font-size: 0.8rem;
  background-color: white;
  width: 16rem;
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

  &::after {
    content: "Ver todos";
  }

  ${Input}:checked + ${PanelsContainer} + &::after {
    content: "Ver menos";
  }
`;
