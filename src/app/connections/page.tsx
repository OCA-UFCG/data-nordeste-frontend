import HubTemplate from "@/templates/HubTemplate";
import PageHeader from "@/components/PageHeader/PageHeader";
import ProjectBigCard from "@/components/ProjectBigtCard/ProjectBigCard";
import { IPageHeader, Project } from "@/utils/interfaces";
import { getContent } from "@/utils/contentful";

export const revalidate = 60;

const PAGE_ID = "projects";

export const CONNECTIONS_PAGE_QUERY = `
  query {
    pageHeadersCollection(limit: 1, where: { id_in: ["${PAGE_ID}"] }) {
      items {
        title
        subtitle
        id
      }
    }

    partnersCollection {
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

interface IConnectionsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  partnersCollection: { items: Project[] };
}

export default async function Connections({}: {}) {
  const {
    pageHeadersCollection: pageHeaders,
    partnersCollection: partners,
  }: IConnectionsContent = await getContent(CONNECTIONS_PAGE_QUERY);

  return (
    <HubTemplate>
      <PageHeader content={pageHeaders.items[0]} />
      {partners.items.map((partner: Project, index: number) => (
        <ProjectBigCard
          key={partner.name}
          project={partner}
          direction={index % 2 === 0 ? "left" : "right"}
        />
      ))}
    </HubTemplate>
  );
}
