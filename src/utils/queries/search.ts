export const SEARCH_INDEX_QUERY = `
  query SearchIndex($preview: Boolean) {
    postCollection(limit: 200, order: date_DESC, preview: $preview) {
      items {
        sys {
          id
        }
        title
        type
        date
        description
        link
        thumb {
          url
        }
        categoryCollection(limit: 5) {
          items {
            name
            id
            color
            tags
            sys {
              id
            }
          }
        }
      }
    }

    panelsCollection(limit: 200, preview: $preview) {
      items {
        sys {
          id
        }
        title
        date
        macroTheme
        descriptionTitle
        description
      }
    }

    dataStoriesCollection(limit: 200, preview: $preview) {
      items {
        sys {
          id
        }
        id
      }
    }

    themeCollection(limit: 100, preview: $preview) {
      items {
        sys {
          id
        }
        id
        name
        color
        tags
        articleTitle
        banner {
          url
        }
      }
    }
  }
`;
