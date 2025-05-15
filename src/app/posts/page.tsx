import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import HubTemplate from "@/templates/HubTemplate";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { getContent, getTotalPages } from "@/utils/functions";
import { SectionHeader } from "@/utils/interfaces";
import { Button } from "react-day-picker";

export const revalidate = 60;

export default async function DataPanel({}: {}) {
  const pages = (await getTotalPages(POSTS_PER_PAGE)) || 1;
  const { theme, sectionHead, pageHeaders } = await getContent([
    "theme",
    "sectionHead",
    "pageHeaders",
  ]);

  return (
    <HubTemplate>
      <PageHeader
        content={pageHeaders.find(
          (section: { fields: { id: string } }) =>
            section.fields.id === "posts",
        )}
      />

      <Posts
        categories={theme}
        header={sectionHead.find(
          (sec: { fields: SectionHeader }) => sec.fields.id == "posts",
        )}
        rootFilter={{ "fields.type[in]": "newsletter,additional-content" }}
        pages={pages}
      />
    </HubTemplate>
  );
}
