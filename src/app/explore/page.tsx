import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import HubTemplate from "@/templates/HubTemplate";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { getContent, getTotalPages } from "@/utils/functions";
import { MacroTheme, SectionHeader } from "@/utils/interfaces";
import { Suspense } from "react";

export const revalidate = 60;

export default async function DataPanel({}: {}) {
  const pages = (await getTotalPages(POSTS_PER_PAGE)) || 1;
  const { theme, pageHeaders, sectionHead } = await getContent([
    "theme",
    "sectionHead",
    "pageHeaders",
  ]);

  return (
    <HubTemplate>
      <PageHeader
        content={pageHeaders.find(
          (section: { fields: { id: string } }) =>
            section.fields.id === "panels",
        )}
      />
      <Suspense>
        <Posts
          categories={Object.fromEntries(
            (theme as { fields: MacroTheme; sys: { id: string } }[]).map(
              (category) => [category.sys.id, category.fields.name],
            ),
          )}
          header={sectionHead.find(
            (sec: { fields: SectionHeader }) => sec.fields.id == "posts",
          )}
          rootFilter={{ "fields.type[in]": "data-panel" }}
          totalPages={pages}
        />
      </Suspense>
    </HubTemplate>
  );
}
