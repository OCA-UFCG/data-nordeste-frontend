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
  thumb?: {
    fields: {
      file: {
        url: string;
      };
    };
  };
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
  description: string;
}

export interface ReportData {
  title: string;
  source: string;
  macroTheme: string;
  macroPainel: boolean;
  description: string;
  thumb: {
    fields: {
      file: {
        url: string;
      };
    };
  };
}

export interface MacroTheme {
  name: string;
  id: string;
  color: string;
}

export interface IPreviewCard {
  title: string;
  subtitle?: string;
  category: { fields: MacroTheme };
  link: string;
  data: string;
  note?: string;
}

export interface IPreviewCards {
  fields: {
    title: string;
    jsonFile: IRegionData;
    category: { fields: MacroTheme };
  };
}

export interface IRegionData {
  region: string;
  title: string;
  subtitle?: string;
  data: string;
  link: string;
  note?: string;
  states: IStateData[];
}

export interface IStateData {
  name: string;
  data: string;
  link: string;
  note?: string;
}

export interface IMainBanner {
  title: string;
  subtitle: string;
  image: {
    fields: {
      file: {
        url: string;
      };
    };
  };
}
