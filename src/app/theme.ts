import { DefaultTheme } from "styled-components";

declare module "styled-components" {
  export interface colorPalette {
    "wine": string;
    "darkgreen": string;
    "green": string;
    "maroon": string;
    "white": string;
    "black": string;
    "dark-gray": string;
    "gray": string;
    "orange": string;
    "yellow": string;
    "salmon": string;
  }

  export interface DefaultTheme {
    colors: colorPalette;
  }
}

export const theme: DefaultTheme = {
  colors: {
    "wine": "#A65E5F",
    "darkgreen": "#5B8951",
    "green": "#4E8648",
    "maroon": "#8f4456",
    "white": "white",
    "black": "#1F1F1F",
    "dark-gray": "#242424",
    "gray": "#858585",
    "orange": "#FF9600",
    "yellow": "#CEA15B",
    "salmon": "#F9E8DD",
  },
};
