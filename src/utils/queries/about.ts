export const ABOUT_PAGE_QUERY = `
  query ($preview: Boolean) {
    pageHeadersCollection(limit: 1, where: { id_in: ["about"]}, preview: $preview) {
      items {
        title
        subtitle
      }
    }

    pageTabsCollection(preview: $preview) {
      items {
        name
        id
        path
      }
    }


    contactInfoCollection(preview: $preview) {
      items {
        name
        type
        path
      }
    }

    partnersInfoCollection(preview: $preview) {
      items {
        id
        details {
          json
        }
        albumCollection {
          items {
            url
            width
            height
            description
          }
        }
      }
    }
  }
`;

export const ABOUT_QUERY = `
  query ($preview: Boolean) {
    aboutCollection(preview: $preview) {
      items {
        id
        albumCollection {
          items {
            url
            width
            height
            description
          }
        }
        details {
          json
        }
        thumb {
          url
        }
      }
    }

    visionMissionValuesCollection(preview: $preview) {
      items {
        id
        title
        thumb {
          url
        }

        details {
          json
        }
      }
    }
  }
`;
