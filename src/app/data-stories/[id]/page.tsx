import { getContent } from "@/utils/functions";
import { notFound } from "next/navigation";

export default async function DataStories({
  params,
}: {
  params: { id: string };
}) {
  const { dataStories } = await getContent(["dataStories"]);
  const selectedStorie = dataStories.find((storie: any) => {
    const fullPath = storie.fields.path;
    const storyId = fullPath.split("/").pop();

    return storyId === params.id;
  });

  if (!selectedStorie) {
    notFound();
  }

  return (
    <iframe
      src={selectedStorie.fields.path}
      className="w-full h-screen border-none"
      allowFullScreen
      allow="geolocation"
    />
  );
}
