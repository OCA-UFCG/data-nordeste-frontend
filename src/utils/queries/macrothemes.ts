// LEGACY: callers pass Contentful macrotheme IDs with underscores; public route
// slugs are normalized before this query is executed.
export const MACROTHEME_PAGE_QUERY = `
  query GetMacroThemePage($slug: String!, $preview: Boolean) {
    themeCollection(limit: 1, where: { id: $slug }, preview: $preview) {
      items {
        name
        id
        color
        tags
        description {
          json
        }
        articleTitle
        article {
          json
        }
        banner {
          url
        }
        sys {
          id
        }
      }
    }

    previewCardsCollection(
      limit: 12
      where: { category: { id: $slug } }
      preview: $preview
    ) {
      items {
        title
        jsonFile
        iconsvg {
          url
        }
        category {
          name
          id
          color
        }
      }
    }

    postCollection(
      where: { 
        category: { id: $slug } 
      }
      preview: $preview
    ) {
      items {
        title
        link
        type
        thumb { url }
        date
        description
      }
    }

    dataStoriesCollection: postCollection(
      where: { 
        category: { id: $slug },
        type: "data-story"
      }
      preview: $preview
    ) {
      items {
        title
        link
        type
        thumb { url }
        date
        description
      }
    }
    
    dashboardCollection: postCollection(
      where: { 
        category: { id: $slug },
        type: "data-panel"
      }
      preview: $preview
    ) {
      items {
        title
        link
        type
        thumb { url }
        date
        description
      }
    }

    postsCollection: postCollection(
      where: { 
        category: { id: $slug },
        type_in: ["newsletter", "additional-content"]
      }
      preview: $preview
    ) {
      items {
        title
        link
        type
        thumb { url }
        date
        description
      }
    }

    sectionHeadCollection(
      where: { id_in: ["preview", "new"] }
      limit: 2
      preview: $preview
    ) {
      items {
        title
        subtitle
        id
      }
    }
  }
`;
