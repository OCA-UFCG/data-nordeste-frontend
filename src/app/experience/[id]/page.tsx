import ArcGisContainer from "@/components/ArcGisContainer/ArcGisContainer";
import HubTemplate from "@/templates/HubTemplate";
import { notFound } from "next/navigation";
import {
  buildExperienceSource,
  isValidArcGisId,
} from "@/features/embeds/arcgis";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";

const EXPERIENCE_TITLE = "Experiência de dados";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return buildMetadata({
    title: EXPERIENCE_TITLE,
    description:
      "Experiência interativa do Data Nordeste para exploração visual de dados e indicadores regionais.",
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
    <HubTemplate showFooter={false}>
      {/* The embed fills the page, so the h1 screen readers expect is hidden. */}
      <h1 className="sr-only">{EXPERIENCE_TITLE}</h1>
      <ArcGisContainer source={buildExperienceSource(id)} />
    </HubTemplate>
  );
}
