import HubTemplate from "@/templates/HubTemplate";
import PageHeader from "@/components/PageHeader/PageHeader";
import ProjectBigCard from "@/components/ProjectBigCard/ProjectBigCard";
import { IPageHeader, Project } from "@/utils/interfaces";
import { getContent } from "@/utils/contentful";
import { CONNECTIONS_PAGE_QUERY } from "@/utils/queries";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";

export const metadata: Metadata = buildMetadata({
  title: "Conexoes",
  description:
    "Rede de parceiros e iniciativas conectadas ao Data Nordeste e a producao de dados para o desenvolvimento regional.",
  path: "/connections",
});

interface IConnectionsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  partnersCollection: { items: Project[] };
}

export default async function Connections() {
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
