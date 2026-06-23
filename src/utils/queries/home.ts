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
  "catalog",
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

    previewCardsCollection(limit: 100, preview: $preview, where: { mostrarNaHomepage: true }) {
      items {
        title
        jsonFile
        category {
          name
          id
          color
        }
        iconsvg {  
            url
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
