export const DATA_PANEL_QUERY = `
  query ($id: String!, $preview: Boolean) {
    panelsCollection(where: { title_in: [$id] }, preview: $preview) {
      items {
        title
        date
        source
        macroTheme
        abovePanelDescription
        descriptionTitle
        # IMPORTANT: seoDescription must exist on the panels content type in every
        # Contentful environment before this ships; an unknown field fails the query.
        seoDescription
        description {
          json
        }
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
