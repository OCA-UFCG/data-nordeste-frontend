import {
    IEEInfo,
    ISudeneChannel,
    ISections,
    INews,
    IContactStatus,
  } from "./interfaces";

export const channels: ISudeneChannel[] = [

  {
    name: "@sudenebr",
    href: "https://www.youtube.com/@sudenebr",
    icon: "youtube",
    size: 27,
  },

  {
    name: "@sudenebr",
    href: "https://www.facebook.com/sudenebr",
    icon: "facebook",
    size: 27,
  },

  {
      name: "@sudenebr",
      href: "https://www.instagram.com/sudenebr",
      icon: "instagram",
      size: 27,
  },

];

export const sections: ISections = {
    home: {
      name: "Início",
      path: "/",
    },
    highlight: {
      name: "Projetos em destaque",
      path: "/highlights"
    },

    multithemed: {
      name: "Material multitemático",
      path: "/multithemed" 
    }
  };