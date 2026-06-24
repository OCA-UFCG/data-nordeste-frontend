// INTENTIONAL: This query fetches a single newsletter/boletim post by sys.id
// along with its category themes, used by the /boletim/[id] detail page.
export const BOLETIM_DETAIL_QUERY = `
  query GetBoletimDetail($id: String!, $preview: Boolean) {
    postCollection(
      limit: 1,
      where: { sys: { id: $id }, type: "newsletter" },
      preview: $preview
    ) {
      items {
        sys { id }
        title
        link
        type
        thumb { url }
        date
        description
        categoryCollection(limit: 5) {
          items {
            name
            sys { id }
          }
        }
      }
    }
  }
`;

// INTENTIONAL: Fetches other newsletters that share the same category/theme
// to populate the "Conteúdos Relacionados" section on the boletim detail page.
export const RELATED_BOLETINS_QUERY = `
  query GetRelatedBoletins(
    $categoryId: String!,
    $excludeId: String!,
    $preview: Boolean
  ) {
    postCollection(
      limit: 8,
      order: date_DESC,
      where: {
        sys: { id_not: $excludeId },
        type: "newsletter",
        category: { sys: { id: $categoryId } }
      },
      preview: $preview
    ) {
      items {
        sys { id }
        title
        link
        type
        thumb { url }
        date
        description
      }
    }
  }
`;
