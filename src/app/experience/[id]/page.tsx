import ArcGisContainer from "@/components/ArcGisContainer/ArcGisContainer";
import HubTemplate from "@/templates/HubTemplate";
import { notFound } from "next/navigation";
import {
  buildExperienceSource,
  isValidArcGisId,
} from "@/features/embeds/arcgis";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return buildMetadata({
    title: "Experiencia de dados",
    description:
      "Experiencia interativa do Data Nordeste para exploracao visual de dados e indicadores regionais.",
    path: `/experience/${id}`,
  });
}

export default async function Experience({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // DO NOT CHANGE: reject non-hex Experience IDs before embedding ArcGIS content.
  if (!isValidArcGisId(id)) return notFound();

  return (
    <HubTemplate>
      <ArcGisContainer source={buildExperienceSource(id)} />
    </HubTemplate>
  );
}
