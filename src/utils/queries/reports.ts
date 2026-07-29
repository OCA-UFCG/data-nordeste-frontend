/**
 * GraphQL query used by the report page (`/reports`).
 * Mirrors the shape used by `about.ts`, `connections.ts`, etc.: page‑level
 * banner + copy live in their own collection (`reportCollection`), while the
 * macrotemes used by the form come from `themeCollection`.
 *
 * `limit: 1` + ordering by creation date is the safe fallback for a single
 * editorial entry that owns the page; filtering by a slug field would require
 * that field to be queryable, which Contentful does not always expose.
 */
export const REPORT_PAGE_QUERY = `
  query GetReportPageContent($preview: Boolean) {
    reportCollection(limit: 1, preview: $preview) {
      items {
        banner {
          url
        }
        textoDoBanner {
          json
        }
        textoDoMunicipio {
          json
        }
        textoDoTema {
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
