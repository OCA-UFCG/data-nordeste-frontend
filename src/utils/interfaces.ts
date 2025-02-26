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

export interface ISectionHeader {
  fields: {
    id: string;
    title: string;
    subtitle?: string;
  };
}
