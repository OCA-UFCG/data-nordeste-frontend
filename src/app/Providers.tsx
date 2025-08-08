"use client";

import StyledComponentsRegistry from "@/lib/registry";
import { ThemeProvider } from "styled-components";
import { GlobalStyles } from "./globalStyles";
import { theme } from "./theme";
import { ApolloProvider } from "@apollo/client";
import { client } from "@/utils/contentful";

export const Providers = (props: React.PropsWithChildren) => {
  return (
    <StyledComponentsRegistry>
      <ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
          <GlobalStyles />
          {props.children}
        </ThemeProvider>
      </ApolloProvider>
    </StyledComponentsRegistry>
  );
};
