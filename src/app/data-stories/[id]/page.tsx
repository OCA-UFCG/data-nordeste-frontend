import HubTemplate from "@/templates/HubTemplate";
import { getEntriesByType } from "@/utils/functions";
import { IDataStory } from "@/utils/interfaces";
import { notFound } from "next/navigation";

export default async function DataStory({
  params,
}: {
  params: { id: string };
}) {
  const story = await getEntriesByType<IDataStory>(
    "",
    1,
    1,
    { "fields.id": params.id },
    "dataStories",
  );

  if (!story.length) return notFound();

  return (
    <HubTemplate>
      <iframe
        src={"https://storymaps.arcgis.com/stories/" + story[0].fields.id}
        className="w-full h-screen"
        allowFullScreen
        allow="geolocation"
      />
    </HubTemplate>
  );
}
