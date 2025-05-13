import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import PageHeader from "@/components/PageHeader/PageHeader";
import FullProjectCard from "@/components/ProjectCard/FullProjectCard";
import { Project } from "@/utils/interfaces";

export const revalidate = 60;

export default async function Connections({}: {}) {
  const { pageHeaders, partners } = await getContent([
    "pageHeaders",
    "partners",
  ]);

  return (
    <HubTemplate>
      <PageHeader
        content={pageHeaders.find(
          (section: { fields: { id: string } }) =>
            section.fields.id === "projects",
        )}
      />
      {partners?.map((partner: { fields: Project }, index: number) => (
        <FullProjectCard
          key={partner.fields.name}
          project={partner}
          direction={index % 2 === 0 ? "left" : "right"}
        />
      ))}
    </HubTemplate>
  );
}
