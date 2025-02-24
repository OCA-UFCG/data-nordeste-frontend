export interface ISection {
  name: string;
  path?: string;
  children?: { [key: string]: ISection };
}

export interface ISections {
  [key: string]: ISection;
}
