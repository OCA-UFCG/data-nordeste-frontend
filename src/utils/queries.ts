import { POSTS_PER_PAGE } from "./constants";

export const HEAD_QUERY = `
  query {
    headerCollection {
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

export const MAIN_PAGE_IDS =
  '["preview", "new", "panels", "about", "projects"]';

export const MAIN_PAGE_QUERY = `
  query {
    mainBannerCollection(limit: 10) {
      items {
        title
        subtitle
        image {
          url
        }
      }
    }
    themeCollection(limit: 20) {
      items {
        name
        id
        color
        sys {
          id
        }
      }
    }

    postCollection(limit: 8) {
      items {
        title
        thumb {
          url
        }
        link
        date
      }
    }

    previewCardsCollection(limit: 12) {
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

    sectionHeadCollection(limit: 5, where: { id_in: ${MAIN_PAGE_IDS} }) {
      items {
        title
        subtitle
        id
        thumb {
          url
        }
      }
    }

    partnersCollection(limit: 10) {
      items {
        name
        thumb {
          url
        }
        link
        description
      }
    }
  }
`;

export const POSTS_QUERY = `
  query ($limit: Int!, $filter: PostFilter) {
    postCollection(limit: $limit, where: $filter) {
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
  query {
    pageHeadersCollection(limit: 1, where: { id_in: ["${PAGE_ID}"] }) {
      items {
        title
        subtitle
        id
      }
    }

    partnersCollection {
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
  query ($id: String!) {
    panelsCollection(where: { title_in: [$id] } ) {
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
  query ($id: String!) {
    dataStoriesCollection(limit: 1, where: { id_in: [$id] } ) {
      items {
        id
      }
    }
  }
`;

export const ABOUT_PAGE_QUERY = `
  query {
    pageHeadersCollection(limit: 1, where: { id_in: ["about"]}) {
      items {
        title
        subtitle
      }
    }

    pageTabsCollection {
      items {
        name
        id
        path
      }
    }


    contactInfoCollection {
      items {
        name
        type
        path
      }
    }

    partnersInfoCollection {
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
  query {
    aboutCollection {
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

    visionMissionValuesCollection {
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
  query GetPosts($header_id: String!, $head_id: String!) {
    pageHeadersCollection(limit: 1, where: { id_in: [$header_id]}) {
      items {
        title
        subtitle
      }
    }

    sectionHeadCollection(limit: 1, where: { id_in: [$head_id]}) {
      items {
        id
        title
        subtitle
        thumb {
          url
        }
      }
    }


  }
`;

export const PUBLICATION_QUERY = `
  query GetPosts($order: [PostOrder], $filter: PostFilter, $skip: Int!) {
    postCollection(limit: ${POSTS_PER_PAGE}, order: $order, where: $filter, skip: $skip) {
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
  query GetPosts($header_id: String!, $head_id: String!) {
    pageHeadersCollection(limit: 1, where: { id_in: [$header_id]}) {
      items {
        title
        subtitle
      }
    }

    sectionHeadCollection(limit: 1, where: { id_in: [$head_id]}) {
      items {
        id
        title
        subtitle
        thumb {
          url
        }
      }
    }

    themeCollection {
      items {
        name
        sys {
          id
        }
      }
    }
  }
`;
