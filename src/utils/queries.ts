import { POSTS_PER_PAGE } from "./constants";

export const HEAD_QUERY = `
  query($preview: Boolean) {
    headerCollection(preview: $preview) {
      items {
        id
        name
        path
        appears
        childrenCollection {
          items {
            ... on Header {
              id
              name
              path
            }
          }
        }
      }
    }
  }

`;

export const MAIN_PAGE_IDS = [
  "preview",
  "new",
  "panels",
  "about",
  "projects",
  "survey",
  "survey-thank-u",
];

export const MAIN_PAGE_QUERY = `
  query($preview: Boolean) {
    mainBannerCollection(limit: 10, preview: $preview) {
      items {
        title
        subtitle
        buttonUrl
        buttonLabel
        image {
          url
        }
      }
    }
    themeCollection(limit: 20, preview: $preview) {
      items {
        name
        id
        color
        sys {
          id
        }
      }
    }

    postCollection(limit: 8, preview: $preview) {
      items {
        title
        thumb {
          url
        }
        link
        date
      }
    }

    previewCardsCollection(limit: 12, preview: $preview) {
      items {
        title
        jsonFile
        category {
          name
          id
          color
        }
      }
    }

    sectionHeadCollection(limit: ${MAIN_PAGE_IDS.length}, where: { id_in: ${JSON.stringify(MAIN_PAGE_IDS)} }, preview: $preview) {
      items {
        title
        subtitle
        id
        thumb {
          url
        }
      }
    }

    partnersCollection(limit: 10, preview: $preview) {
      items {
        name
        thumb {
          url
        }
        link
        description
      }
    }

    feedbackCollection(preview: $preview) {
      items {
        id
        question {
          json
        }
        shape
        type
      }
    }
  }
`;

export const POSTS_QUERY = `
  query ($limit: Int!, $filter: PostFilter, $preview: Boolean) {
    postCollection(limit: $limit, where: $filter, preview: $preview) {
      items {
        title
        thumb {
          url
        }
        link
        date
      }
    }
  }

`;

export const PAGE_ID = "projects";

export const CONNECTIONS_PAGE_QUERY = `
  query ($preview: Boolean) {
    pageHeadersCollection(limit: 1, where: { id_in: ["${PAGE_ID}"] }, preview: $preview) {
      items {
        title
        subtitle
        id
      }
    }

    partnersCollection(preview: $preview) {
      items {
        name
        link
        details {
          json
        }
        thumb {
          url
        }
      }
    }
  }
`;

export const DATA_PANEL_QUERY = `
  query ($id: String!, $preview: Boolean) {
    panelsCollection(where: { title_in: [$id] }, preview: $preview) {
      items {
        title
        date
        source
        macroTheme
      }
    }
  }
`;

export const DATA_STORY_QUERY = `
  query ($id: String!, $preview: Boolean) {
    dataStoriesCollection(limit: 1, where: { id_in: [$id] }, preview: $preview) {
      items {
        id
      }
    }
  }
`;

export const ABOUT_PAGE_QUERY = `
  query ($preview: Boolean) {
    pageHeadersCollection(limit: 1, where: { id_in: ["about"]}, preview: $preview) {
      items {
        title
        subtitle
      }
    }

    pageTabsCollection(preview: $preview) {
      items {
        name
        id
        path
      }
    }


    contactInfoCollection(preview: $preview) {
      items {
        name
        type
        path
      }
    }

    partnersInfoCollection(preview: $preview) {
      items {
        id
        details {
          json
        }
        albumCollection {
          items {
            url
            width
            height
            description
          }
        }
      }
    }
  }
`;

export const ABOUT_QUERY = `
  query ($preview: Boolean) {
    aboutCollection(preview: $preview) {
      items {
        id
        albumCollection {
          items {
            url
            width
            height
            description
          }
        }
        details {
          json
        }
        thumb {
          url
        }
      }
    }

    visionMissionValuesCollection(preview: $preview) {
      items {
        id
        title
        thumb {
          url
        }

        details {
          json
        }
      }
    }
  }
`;

export const POST_PAGE_QUERY = `
  query GetPosts($header_id: String!, $head_id: String!, $preview: Boolean) {
    pageHeadersCollection(limit: 1, where: { id_in: [$header_id]}, preview: $preview) {
      items {
        title
        subtitle
      }
    }

    sectionHeadCollection(limit: 1, where: { id_in: [$head_id]}, preview: $preview) {
      items {
        id
        title
        subtitle
        thumb {
          url
        }
      }
    }

    postCollection(preview: $preview) {
      total
    }
  }
`;

export const PUBLICATION_QUERY = `
  query GetPosts($order: [PostOrder], $filter: PostFilter, $skip: Int!, $preview: Boolean) {
    postCollection(limit: ${POSTS_PER_PAGE}, order: $order, where: $filter, skip: $skip, preview: $preview) {
      total
      items {
        title
        link
        thumb {
          url
        }
        type
        date
        description
      }
    }
  }
`;

export const EXPLORE_PAGE_QUERY = `
  query GetPosts($header_id: String!, $head_id: String!, $preview: Boolean) {
    pageHeadersCollection(limit: 1, where: { id_in: [$header_id]}, preview: $preview) {
      items {
        title
        subtitle
      }
    }

    sectionHeadCollection(limit: 1, where: { id_in: [$head_id]}, preview: $preview) {
      items {
        id
        title
        subtitle
        thumb {
          url
        }
      }
    }

    themeCollection(preview: $preview) {
      items {
        name
        sys {
          id
        }
      }
    }

    postCollection(preview: $preview) {
      total
    }
  }
`;

export const FILTERS_QUERY = `
  query GetFilters($preview: Boolean) {
    filterDataPageCollection(preview: $preview) {
      items {
        title
        type
        optionsCollection { 
          items {
            ... on FilterOptions { 
              title
              slug
            }
          }
        }
      }
    }
  }
`;
