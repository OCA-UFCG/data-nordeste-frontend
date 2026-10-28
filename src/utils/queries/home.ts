import { POSTS_PER_PAGE } from "../constants";

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
        sys { id }
        title
        thumb {
          url
        }
        link
        date
        type
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

const RECENT_POST_FIELDS = `
  items {
    sys { id }
    title
    thumb {
      url
    }
    link
    date
    type
    description: descriptionNew { json }
  }
`;

// PERF: every home tab in one operation. The server data cache then holds the
// whole section as one entry instead of the browser calling Contentful per click.
export const RECENT_POSTS_BY_TAB_QUERY = `
  query GetRecentPostsByTab(
    $allFilter: PostFilter
    $panelsFilter: PostFilter
    $storiesFilter: PostFilter
    $newslettersFilter: PostFilter
    $publicationsFilter: PostFilter
    $preview: Boolean
  ) {
    all: postCollection(limit: ${POSTS_PER_PAGE}, where: $allFilter, preview: $preview) {
      ${RECENT_POST_FIELDS}
    }
    panels: postCollection(limit: ${POSTS_PER_PAGE}, where: $panelsFilter, preview: $preview) {
      ${RECENT_POST_FIELDS}
    }
    stories: postCollection(limit: ${POSTS_PER_PAGE}, where: $storiesFilter, preview: $preview) {
      ${RECENT_POST_FIELDS}
    }
    newsletters: postCollection(limit: ${POSTS_PER_PAGE}, where: $newslettersFilter, preview: $preview) {
      ${RECENT_POST_FIELDS}
    }
    publications: postCollection(limit: ${POSTS_PER_PAGE}, where: $publicationsFilter, preview: $preview) {
      ${RECENT_POST_FIELDS}
    }
  }
`;
