// Posts dos painéis originais cujas capas viram os cards de /demo
// (links em src/features/experimental/panels.ts).
export const EXPERIMENTAL_PANELS_QUERY = `
  query GetExperimentalPanels($links: [String], $preview: Boolean) {
    postCollection(where: { link_in: $links }, limit: 10, preview: $preview) {
      items {
        sys { id }
        title
        link
        type
        thumb { url }
      }
    }
  }
`;
