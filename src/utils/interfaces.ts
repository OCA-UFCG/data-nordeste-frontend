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
