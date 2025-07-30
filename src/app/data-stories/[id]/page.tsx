import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { IDataStory } from "@/utils/interfaces";
import { DATA_STORY_QUERY } from "@/utils/queries";
import { notFound } from "next/navigation";

interface IDataStoryContent {
  dataStoriesCollection: { items: IDataStory[] };
}

export default async function DataStory({
  params,
}: {
  params: { id: string };
}) {
  const { dataStoriesCollection: story }: IDataStoryContent = await getContent(
    DATA_STORY_QUERY,
    { id: params.id },
  );

  if (!story.items.length) return notFound();

  return (
    <HubTemplate>
      <iframe
        src={"https://storymaps.arcgis.com/stories/" + story.items[0].id}
        className="w-full h-screen"
        allowFullScreen
        allow="geolocation"
      />
    </HubTemplate>
  );
}
