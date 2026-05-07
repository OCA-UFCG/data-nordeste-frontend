import { POSTS_PER_PAGE } from "../constants";

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

// INTENTIONAL: /explore includes publications and datastories alongside panels
// because the page is a discovery hub for data experiences, not only dashboards.
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
