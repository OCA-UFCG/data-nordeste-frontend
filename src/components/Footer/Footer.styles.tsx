"use client";
import styled from "styled-components";
import Link from "next/link";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.footer`
  display: flex;
  padding: 4rem 2rem;
  margin-top: auto;
  box-sizing: border-box;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.black};

  gap: 1rem;
  position: relative;
  width: 100%;
  align-items: center;

  @media (max-width: 800px) {
    align-items: center;
    flex-direction: column;
  }
`;

export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 1.3rem;
  box-sizing: border-box;

  @media (max-width: 800px) {
    flex-direction: column;
    align-items: center;
    margin-top: 1rem;
    width: 100%;
  }
`;

export const Divider = styled.div`
  width: 30vw;
  height: 2px;
  background-color: ${({ theme }) => theme.colors.white};
  margin: 0.8rem 0;

  @media (max-width: 800px) {
    width: 100%;
  }
`;

export const LogoImage = styled(Icon)`
  height: fit-content;
  width: 24rem;
`;

export const SectionTitle = styled(Link)`
  color: ${({ theme }) => theme.colors.white};
  font-weight: bolder;

  text-decoration: none;
  transition: 0.2s;
  font-size: 1.1rem;
  margin-bottom: 1px;

  @media (max-width: 800px) {
    text-align: center;
    width: fit-content;
    align-self: center;
  }

  &:hover {
    opacity: 0.6;
  }
`;

export const NavSections = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 1.3rem;

  @media (max-width: 800px) {
    text-align: center;
  }
`;

export const SocialMediasContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  max-width: 100%;

  @media (max-width: 800px) {
    align-self: center;
    justify-content: center;
    flex-wrap: wrap;
  }
`;

export const SocialMediaName = styled.span`
  display: flex;
  color: ${({ theme }) => theme.colors.white};
  font-size: 16px;
  letter-spacing: 0.8px;
  align-items: flex-end;
`;

export const SocialMedia = styled(Link)`
  display: flex;
  gap: 0.5rem;
  transition: 0.2s;
  text-decoration: none;
  align-items: center;
  color: ${({ theme }) => theme.colors.white};

  &:hover {
    opacity: 0.6;
  }

  img {
    cursor: pointer;
    max-width: 1.75rem;
    max-height: 1.75rem;
    filter: brightness(0) invert(1);
  }
`;
