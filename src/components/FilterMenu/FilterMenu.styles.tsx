"use client";
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  box-sizing: border-box;
`;

export const Header = styled.label`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.55rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.black}50;
  border-radius: 4px;
  box-sizing: border-box;
  justify-content: center;
  cursor: pointer;
`;

export const Expand = styled(Icon)`
  transition: 300ms;

  input:checked + ${Header} &,
  ${Wrapper}:hover & {
    transform: rotate(180deg);
  }
`;

export const Text = styled.span`
  line-height: 0.75rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TextContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

export const Content = styled.div`
  padding: 1rem;
  box-sizing: border-box;
  position: absolute;
  top: 2rem;
  right: 0;
  z-index: 1;
  background: white;
  border-radius: 4px;
  display: none;
  box-shadow: 0px 0px 4px #cdcdcd;

  input:checked + ${Header} + & {
    display: flex;
  }
`;

export const ContentWrapper = styled.ul`
  list-style: none;
  margin: 0;
  display: flex;
  flex-flow: column;
  width: 100%;
  gap: 0.5rem;
`;

export const ContentItem = styled.li`
  transition: 300ms;
  cursor: pointer;
  margin: 0;

  &:hover {
    opacity: 0.6;
  }
`;

export const FormHeader = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

export const Close = styled(Icon)`
  transition: 300ms;
  cursor: pointer;

  &:hover {
    opacity: 0.6;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-flow: column;
  gap: 0.75rem;
  width: 100%;
`;

export const CategoryTitle = styled.h3`
  font-weight: bold;
`;

export const Label = styled.label`
  width: fit-content;
  display: flex;
  gap: 0.5rem;
`;

export const CategoriesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
  min-width: 20rem;
`;

export const Category = styled.span`
  white-space: nowrap;
  width: max-content;
`;

export const Select = styled.input``;

export const DatesWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const DateLabel = styled.label`
  display: flex;
  gap: 0.5rem;
  flex-flow: column;
`;

export const DateTitle = styled.span`
  font-size: 0.8rem;
`;

export const Date = styled.input`
  border: 1px solid #cdcdcd;
  padding: 0.5rem;
  border-radius: 4px;
`;

export const SubmitButton = styled.button`
  border-radius: 4px;
  width: 100%;
  background-color: transparent;
  padding: 0.5rem;
  font-weight: bold;
  transition: 300ms;
  cursor: pointer;
  border: 2px solid ${({ theme }) => theme.colors.black};

  &:hover {
    background-color: ${({ theme }) => theme.colors.black};
    color: white;
  }
`;
