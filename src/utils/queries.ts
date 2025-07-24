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

    sectionHeadCollection(limit: 5, where: { id_in: ["preview", "new", "panels", "about", "projects"] }) {
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
