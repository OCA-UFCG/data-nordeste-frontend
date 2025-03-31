"use client";
import { Section } from "@/app/globalStyles";
import { Icon } from "@/components/Icon/Icon";
import styled from "styled-components";

export const Wrapper = styled(Section)`
  margin: 2rem 0;
  margin-bottom: 5rem;
`;

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
  display: flex;
  column-count: 3;
  flex-wrap: wrap;
  justify-content: center;
  padding: 1rem;
  align-items: center;
  gap: 2rem;

  @media screen and (max-width: 700px) {
    column-count: 2;
  }

  @media screen and (max-width: 600px) {
    column-count: 1;
  }
`;

export const Button = styled.button`
  background-color: white;
  border: 2px solid #60925a;
  color: #60925a;
  font-weight: bold;
  padding: 0.5rem 3rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;

  &:hover {
    background-color: #60925a;
    color: white;
  }
`;
