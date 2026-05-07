import ArcGisContainer from "@/components/ArcGisContainer/ArcGisContainer";
import HubTemplate from "@/templates/HubTemplate";
import { notFound } from "next/navigation";
import {
  buildExperienceSource,
  isValidArcGisId,
} from "@/features/embeds/arcgis";

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
