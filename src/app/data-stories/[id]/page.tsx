import ArcGisContainer from "@/components/ArcGisContainer/ArcGisContainer";
import HubTemplate from "@/templates/HubTemplate";
import { notFound } from "next/navigation";
import { buildStoryMapSource, isValidArcGisId } from "@/features/embeds/arcgis";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return buildMetadata({
    title: "Datastory",
    description:
      "Datastory interativo do Data Nordeste com narrativa visual baseada em dados regionais.",
    path: `/data-stories/${id}`,
  });
}

export default async function DataStory({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // DO NOT CHANGE: reject non-hex StoryMap IDs before embedding ArcGIS content.
  if (!isValidArcGisId(id)) return notFound();

  return (
    <HubTemplate>
      <ArcGisContainer source={buildStoryMapSource(id)} />
    </HubTemplate>
  );
}
