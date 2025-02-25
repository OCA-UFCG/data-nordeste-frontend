import { getContent } from "@/utils/functions";
import HubTemplate from "@/templates/hubTemplate";

export default async function Home() {
  const {} = await getContent([]);

  return <HubTemplate></HubTemplate>;
}
