"use client"
import styled from "styled-components";
import { Icon } from "../Icon/Icon";

export const Banner = styled(Icon)`
    width: 100%;
    height: auto;

    @media (max-width: 800px) {
      
    }
`;
    
export const BannerContainer = styled.div`
    display: flex; 
    flex-direction: column; 
    background-color: ${({ theme }) => theme.colors.green};
    border-radius: 1rem;
    padding-bottom: 1rem; 

    @media (max-width: 800px) {
        max-width: 100%;
        border-radius: 0.5rem;
        padding-bottom: 0.5rem;
    }
    
`;