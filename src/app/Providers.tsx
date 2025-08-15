"use client";

import { ThemeProvider } from "styled-components";
import { theme } from "./theme";
import { ApolloProvider } from "@apollo/client";
import { client } from "@/utils/contentful";

export const Providers = (props: React.PropsWithChildren) => {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>{props.children}</ThemeProvider>
    </ApolloProvider>
  );
};
