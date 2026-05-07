export const CATALOG_ID = "catalog";

// INTENTIONAL: Contentful owns catalog filter labels/options, while Zenodo owns
// the dataset records rendered by the catalog page.
export const FILTERS_QUERY = `
  query GetFiltersAndThemes($preview: Boolean) {
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

    pageHeadersCollection(limit: 1, where: { id_in: ["${CATALOG_ID}"] }, preview: $preview) {
      items {
        title
        subtitle
        richSubtitle {
          json
        }
      }
    }

    themeCollection(limit: 30, preview: $preview) {
      items {
        name
        id
        color
        sys {
          id
        }
      }
    }
  }
`;
