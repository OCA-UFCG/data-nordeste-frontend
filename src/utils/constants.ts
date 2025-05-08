import { EntrySys, OrderFilterPaths } from "contentful";
import { ISudeneChannel } from "./interfaces";

export const channels: ISudeneChannel[] = [
  {
    name: "@sudenebr",
    href: "https://www.youtube.com/sudenebr",
    icon: "youtube",
    size: 32,
  },

  {
    name: "@sudenebr",
    href: "https://www.facebook.com/sudenebr",
    icon: "facebook",
    size: 32,
  },

  {
    name: "@sudenebr",
    href: "https://www.instagram.com/sudenebr",
    icon: "instagram",
    size: 32,
  },

  {
    name: "@sudenebr",
    href: "https://br.linkedin.com/company/superintend-ncia-do-desenvolvimento-do-nordeste",
    icon: "linkedin",
    size: 32,
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
  "additional-content": "Notícia",
  "data-panel": "Painel de dados",
  newsletter: "Boletim",
};

export const macroThemes: { [key: string]: string } = {
  economia_e_renda: "money",
  demografia: "user",
  saude: "health",
  educacao: "book",
  infraestrutura_e_saneamento: "screwdriver",
  seguranca_hidrica: "drop",
  meio_ambiente: "leaf",
};
