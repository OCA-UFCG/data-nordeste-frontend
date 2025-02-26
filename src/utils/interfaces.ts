export interface ISudeneChannel {
  name: string;
  href: string;
  icon: string;
  size?: number;
}

export interface ISection {
  name: string;
  id: string;
  path: string;
  appears: boolean;
  children?: { fields: ISection }[];
}

export interface ISections {
  [key: string]: ISection;
}

export interface Project {
  name: string;
  description: string;
  link: string;
  thumb: {
    fields: {
      file: {
        url: string;
      };
    };
  };
}
