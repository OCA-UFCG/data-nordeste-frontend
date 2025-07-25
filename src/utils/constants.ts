import { EntrySys, OrderFilterPaths } from "contentful";
import { ISudeneChannel } from "./interfaces";

export const REVALIDATE = 60;

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
  "Ordem Alfabética": "fields.title" as "sys.contentType.sys.id",
  "Mais recente": "-fields.date" as "sys.contentType.sys.id",
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

export const exploreFilterMap: {
  [key: string]: { name: string; formatFunc: (params: any) => any };
} = {
  category: {
    name: "fields.category.sys.id[in]",
    formatFunc: (selectedCats: string[]) =>
      selectedCats.length > 0 && !("all" in selectedCats)
        ? selectedCats.join(",")
        : null,
  },
  initDate: {
    name: "fields.date[gte]",
    formatFunc: (date: Date | undefined) => (date ? date.toISOString() : null),
  },

  finalDate: {
    name: "fields.date[lte]",
    formatFunc: (date: Date | undefined) => (date ? date.toISOString() : null),
  },

  type: {
    name: "fields.type[in]",
    formatFunc: (selectedCats: string[]) =>
      selectedCats.length > 0 && !("all" in selectedCats)
        ? selectedCats.join(",")
        : null,
  },
};
