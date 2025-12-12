import HubTemplate from "@/templates/HubTemplate";
import PageHeader from "@/components/PageHeader/PageHeader";
import ProjectBigCard from "@/components/ProjectBigtCard/ProjectBigCard";
import { IPageHeader, Project } from "@/utils/interfaces";
import { getContent } from "@/utils/contentful";
import { REVALIDATE } from "@/utils/constants";
import { CONNECTIONS_PAGE_QUERY } from "@/utils/queries";

export const revalidate = REVALIDATE;

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
      <div className="w-full max-w-[1440px]">
        {partners.items.map((partner: Project, index: number) => (
          <ProjectBigCard
            key={partner.name}
            project={partner}
            direction={index % 2 === 0 ? "left" : "right"}
          />
        ))}
      </div>
    </HubTemplate>
  );
}
