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
  children?: { field: ISection }[];
}

export interface ISections {
  [key: string]: ISection;
}
