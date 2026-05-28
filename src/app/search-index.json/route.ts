import { REVALIDATE } from "@/utils/constants";
import { getSearchIndex } from "@/features/search/contentful";

export async function GET() {
  const index = await getSearchIndex();

  return Response.json(index, {
    headers: {
      "Cache-Control": `public, s-maxage=${REVALIDATE}, stale-while-revalidate=${REVALIDATE}`,
    },
  });
}
