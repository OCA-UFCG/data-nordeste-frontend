"use client";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";
import Link from "next/link";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: max-content;
  height: 100%;
  z-index: 0;
  background-color: #fff;
  gap: 0.5rem;
  overflow-x: scroll;
  padding: 1rem;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const Title = styled.h2`
  text-align: center;
  font-size: 1.2rem;
  font-weight: 700;
`;

export const Text = styled.p`
  margin: 0;
  text-decoration: underline;
`;

export const RightIcon = styled(Icon)`
  transform: rotate(90deg);
`;

export const Home = styled(Link)`
  display: flex;
  gap: 0.5rem;
  box-sizing: border-box;
  align-items: center;
  transition: 300ms;

  &:hover {
    opacity: 0.6;
  }
`;
