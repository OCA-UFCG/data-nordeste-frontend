import { EntrySys, OrderFilterPaths } from "contentful";
import { ISudeneChannel } from "./interfaces";

export const REVALIDATE = process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW
  ? 60
  : 3600;

export const STORAGE_KEY = "datane@feedback_submitted";

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
export const RECORDS_PER_PAGE = 6;
export const PAGINATION_SIZE = 3;

export const sortingTypes: {
  [x: string]:
    | OrderFilterPaths<EntrySys, "sys">
    | "sys.contentType.sys.id"
    | "-sys.contentType.sys.id";
} = {
  "Ordem Alfabética": "title_ASC" as "sys.contentType.sys.id",
  "Mais recente": "date_DESC" as "sys.contentType.sys.id",
};

export const dataSortingTypes = {
  "Mais recente": "mostrecent",
  "Mais visualizados": "mostviewed",
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

export const themes = {
  "Economia e Renda": "economia-e-renda",
  Demografia: "demografia",
  Saúde: "saude",
  Educação: "educacao",
  "Infraestrutura e Saneamento": "infraestrutura-e-saneamento",
  "Segurança Hídrica": "seguranca-hidrica",
  "Meio Ambiente": "meio-ambiente",
};

export const exploreFilterMap: {
  [key: string]: {
    name: string;
    formatForm: (params: any) => { [key: string]: any };
    formatParam: (params: any) => { [key: string]: string | null };
  };
} = {
  category: {
    name: "{category: {sys: id_in:",
    formatForm: (selectedCats: string[]) =>
      selectedCats.length
        ? {
            category: {
              sys: {
                id_in: selectedCats,
              },
            },
          }
        : { category: null },
    formatParam: (selectedCats: string[]) => ({
      category:
        selectedCats.length > 0 && !("all" in selectedCats)
          ? selectedCats.join(",")
          : null,
    }),
  },
  date_gte: {
    name: "fields.date[gte]",
    formatForm: (date: Date | null) => ({
      date_gte: date ? date.toISOString() : null,
    }),
    formatParam: (date: Date | null) => ({
      date_gte: date ? date.toISOString() : null,
    }),
  },

  date_lte: {
    name: "fields.date[lte]",
    formatForm: (date: Date | null) => ({
      date_lte: date ? date.toISOString() : null,
    }),
    formatParam: (date: Date | null) => ({
      date_lte: date ? date.toISOString() : null,
    }),
  },

  type_in: {
    name: "fields.type[in]",
    formatForm: (selectedCats: string[]) => ({
      type_in: selectedCats,
    }),
    formatParam: (selectedCats: string[]) => ({
      type_in:
        selectedCats.length > 0 && !("all" in selectedCats)
          ? selectedCats.join(",")
          : null,
    }),
  },
};
