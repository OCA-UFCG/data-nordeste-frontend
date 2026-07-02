import { POSTS_PER_PAGE } from "../constants";

export const POST_PAGE_QUERY = `
  query GetPosts($header_id: String!, $head_id: String!, $preview: Boolean) {
    pageHeadersCollection(limit: 1, where: { id_in: [$header_id]}, preview: $preview) {
      items {
        title
        subtitle
        richSubtitle {
          json
        }
        banner {
          url
        }
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

export const PUBLICATION_QUERY = `
  query GetPosts($order: [PostOrder], $filter: PostFilter, $skip: Int!, $preview: Boolean) {
    postCollection(limit: ${POSTS_PER_PAGE}, order: $order, where: $filter, skip: $skip, preview: $preview) {
      total
      items {
        sys { id }
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

// PERF: One operation keeps cards and tab visibility consistent while avoiding
// three full card payloads that were previously downloaded only to read totals.
export const EXPLORE_RESULTS_QUERY = `
  query GetExploreResults(
    $order: [PostOrder]
    $activeFilter: PostFilter
    $dashboardsFilter: PostFilter
    $datastoriesFilter: PostFilter
    $publicationsFilter: PostFilter
    $skip: Int!
    $preview: Boolean
  ) {
    activePosts: postCollection(
      limit: ${POSTS_PER_PAGE}
      order: $order
      where: $activeFilter
      skip: $skip
      preview: $preview
    ) {
      total
      items {
        sys { id }
        title
        link
        thumb { url }
        type
        date
        description
      }
    }
    dashboards: postCollection(limit: 1, where: $dashboardsFilter, preview: $preview) {
      total
    }
    datastories: postCollection(limit: 1, where: $datastoriesFilter, preview: $preview) {
      total
    }
    publications: postCollection(limit: 1, where: $publicationsFilter, preview: $preview) {
      total
    }
  }
`;

// INTENTIONAL: /explore includes publications and datastories alongside panels
// because the page is a discovery hub for data experiences, not only dashboards.
export const EXPLORE_PAGE_QUERY = `
  query GetExplorePage($header_id: String!, $preview: Boolean) {
    pageHeadersCollection(limit: 1, where: { id_in: [$header_id]}, preview: $preview) {
      items {
        title
        subtitle
        banner {
          url
        }
      }
    }

    themeCollection(preview: $preview) {
      items {
        name
        id
        color
        sys {
          id
        }
      }
    }

    tabHeadersCollection: pageHeadersCollection(
      where: { id_in: ["dataPanels", "dataNarrative", "publications"] }
      limit: 3
      preview: $preview
    ) {
      items {
        id
        title
        subtitle
        richSubtitle {
          json
        }
      }
    }
  }
`;
