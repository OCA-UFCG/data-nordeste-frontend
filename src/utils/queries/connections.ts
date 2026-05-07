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
