import { EntrySys, OrderFilterPaths } from "contentful";
import { ISudeneChannel } from "./interfaces";

export const channels: ISudeneChannel[] = [
  {
    name: "@sudenebr",
    href: "https://www.youtube.com/@sudenebr",
    icon: "youtube",
    size: 20,
  },

  {
    name: "@sudenebr",
    href: "https://www.facebook.com/sudenebr",
    icon: "facebook",
    size: 20,
  },

  {
    name: "@sudenebr",
    href: "https://www.instagram.com/sudenebr",
    icon: "instagram",
    size: 20,
  },
];

export const POSTS_PER_PAGE = 12;

export const sortingTypes: {
  [x: string]:
    | OrderFilterPaths<EntrySys, "sys">
    | "sys.contentType.sys.id"
    | "-sys.contentType.sys.id";
} = {
  "A-Z": "fields.title" as "sys.contentType.sys.id",
  "Z-A": "-fields.title" as "-sys.contentType.sys.id",
  "Data de publicação": "-fields.date" as "sys.contentType.sys.id",
};

export const POST_TYPES = {
  "additional-content": "Conteúdo adicional",
  "data-panel": "Painel de dados",
  newsletter: "Boletim",
};
