export interface ISudeneChannel {
  name: string;
  href: string;
  icon: string;
  size?: number;
}

export interface SectionHeader {
  id: string;
  title: string;
  subtitle: string;
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

export interface ISectionHeader {
  fields: {
    id: string;
    title: string;
    subtitle?: string;
  };
}

export interface IPublication {
  title: string;
  link: string;
  thumb: {
    fields: {
      file: {
        url: string;
      };
    };
  };
  type: string;
  date: string;
}

export interface ReportData {
  title: string;
  reportId: string;
}

export interface IPreviewCard {
  title: string;
  subtitle?: string;
  data: string;
  note?: string;
}
