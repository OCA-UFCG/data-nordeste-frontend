export const DATA_PANEL_QUERY = `
  query ($id: String!, $preview: Boolean) {
    panelsCollection(where: { title_in: [$id] }, preview: $preview) {
      items {
        title
        date
        source
        macroTheme
      }
    }
    pageHeadersCollection(limit: 1, where: { id_in: ["anchor"]}, preview: $preview) {
      items {
        title
        subtitle
      }
    }
  }
`;

export const DATA_STORY_QUERY = `
  query ($id: String!, $preview: Boolean) {
    dataStoriesCollection(limit: 1, where: { id_in: [$id] }, preview: $preview) {
      items {
        id
      }
    }
  }
`;
