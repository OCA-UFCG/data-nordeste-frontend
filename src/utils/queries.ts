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
